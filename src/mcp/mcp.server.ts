import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IAutomationService } from 'src/automation/interfaces/automation.interfaces';
import type { RawData, WebSocket } from 'ws';
import { WebSocketServer } from 'ws';
import { AuthService } from '../auth/auth.service';
import type { UserContext } from '../auth/interfaces/user-context.interface';
import { AgentService } from '../automation/agent.service';
import type { CallToolRequest, McpRequest, McpResponse } from './mcp.types';
import { TYPES } from 'src/utilities/constant';
import { IAgentService } from 'src/automation/interfaces/agent.interfaces';

const WORKFLOW_READ_SCOPE = 'workflow.read';
const ANALYTICS_READ_SCOPE = 'analytics.read';
const AI_GENERATE_SCOPE = 'ai.generate';
const AGENT_EXECUTE_SCOPE = 'agent.execute';

@Injectable()
export class McpServer implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(McpServer.name);
  private server?: WebSocketServer;
  private readonly sessionContext = new Map<WebSocket, UserContext>();

  constructor(
    private readonly configService: ConfigService,
    @Inject(TYPES.IAutomationService)
    private readonly _automationService: IAutomationService,
    @Inject(TYPES.IAutomationService)
    private readonly _agentService: IAgentService,
    private readonly authService: AuthService,
  ) {}

  onModuleInit(): void {
    const enabled = this.configService.get<string>('MCP_ENABLED', 'true');
    if (enabled !== 'true') {
      this.logger.log('MCP server disabled via MCP_ENABLED');
      return;
    }

    const port = Number.parseInt(
      this.configService.get<string>('MCP_PORT', '4000'),
      10,
    );
    const host = this.configService.get<string>('MCP_HOST', '0.0.0.0');

    this.server = new WebSocketServer({ port, host });
    this.server.on('connection', (socket: WebSocket) => {
      this.logger.log('Client connected to MCP server');
      this.sendEvent(socket, 'ready', {
        server: 'Automation MCP Server',
        version: '1.0.0',
      });
      this.sendEvent(socket, 'authentication_required');

      socket.on('message', async (data: RawData) => {
        await this.handleMessage(socket, data);
      });

      socket.on('close', () => {
        this.logger.log('Client disconnected from MCP server');
        this.sessionContext.delete(socket);
      });
    });

    this.logger.log(`MCP server listening on ws://${host}:${port}`);
  }

  onModuleDestroy(): void {
    if (this.server) {
      this.server.close();
      this.server = undefined;
    }
    this.sessionContext.clear();
  }

  private async handleMessage(socket: WebSocket, rawData: RawData) {
    let payload: McpRequest;
    try {
      payload = JSON.parse(rawData.toString()) as McpRequest;
    } catch (error) {
      this.logger.warn('Received invalid MCP payload');
      this.sendError(socket, undefined, 'Invalid JSON payload');
      return;
    }

    switch (payload.type) {
      case 'initialize':
        this.handleInitialize(socket, payload.id);
        break;
      case 'authenticate':
        this.handleAuthenticate(socket, payload.token, payload.id);
        break;
      case 'list_tools':
        this.handleListTools(socket, payload.id);
        break;
      case 'call_tool':
        await this.handleCallTool(socket, payload);
        break;
      case 'ping':
        this.sendResult(socket, payload.id, { pong: true });
        break;
    }
  }

  private handleAuthenticate(socket: WebSocket, token: string, id?: string) {
    const context = this.authService.validateToken(token);
    if (!context) {
      this.sendError(socket, id, 'Invalid authentication token');
      return;
    }

    this.sessionContext.set(socket, context);
    this.sendResult(socket, id, {
      userId: context.userId,
      scopes: context.scopes,
    });
  }

  private handleInitialize(socket: WebSocket, id?: string) {
    const response: McpResponse = {
      type: 'result',
      id,
      result: {
        server: {
          name: 'automation-api',
          version: '1.0.0',
        },
        capabilities: {
          tools: true,
        },
      },
    };

    socket.send(JSON.stringify(response));
  }

  private handleListTools(socket: WebSocket, id?: string) {
    const context = this.sessionContext.get(socket);
    if (!context) {
      this.sendError(socket, id, 'Authentication required');
      return;
    }

    const tools: Array<Record<string, unknown>> = [];

    if (context.scopes.includes(WORKFLOW_READ_SCOPE)) {
      tools.push({
        name: 'list_workflows',
        description: 'Returns all workflows stored in the automation database.',
        input_schema: {
          type: 'object',
          properties: {},
        },
      });
    }

    if (context.scopes.includes(ANALYTICS_READ_SCOPE)) {
      tools.push({
        name: 'workflow_analytics',
        description: 'Provides aggregate statistics about workflows.',
        input_schema: {
          type: 'object',
          properties: {},
        },
      });
    }

    if (context.scopes.includes(AI_GENERATE_SCOPE)) {
      tools.push({
        name: 'generate_ai',
        description:
          'Generates text using OpenRouter based on the provided prompt.',
        input_schema: {
          type: 'object',
          properties: {
            prompt: { type: 'string' },
          },
          required: ['prompt'],
        },
      });
    }

    if (context.scopes.includes(AGENT_EXECUTE_SCOPE)) {
      tools.push({
        name: 'agent_ask',
        description:
          'Runs the AI agent orchestration pipeline to choose tools and craft a response.',
        input_schema: {
          type: 'object',
          properties: {
            prompt: { type: 'string' },
            outputFormat: {
              type: 'string',
              enum: ['text', 'markdown', 'html'],
            },
          },
          required: ['prompt'],
        },
      });
    }

    this.sendResult(socket, id, { tools });
  }

  private async handleCallTool(socket: WebSocket, message: CallToolRequest) {
    const context = this.sessionContext.get(socket);
    if (!context) {
      this.sendError(socket, message.id, 'Authentication required');
      return;
    }

    try {
      switch (message.tool) {
        case 'list_workflows': {
          if (!context.scopes.includes(WORKFLOW_READ_SCOPE)) {
            this.sendError(socket, message.id, 'Missing workflow.read scope');
            return;
          }

          const workflows = await this._automationService.listWorkflows();
          this.sendResult(socket, message.id, { workflows });
          break;
        }
        case 'workflow_analytics': {
          if (!context.scopes.includes(ANALYTICS_READ_SCOPE)) {
            this.sendError(socket, message.id, 'Missing analytics.read scope');
            return;
          }

          const analytics =
            await this._automationService.getWorkflowAnalytics();
          this.sendResult(socket, message.id, analytics);
          break;
        }
        case 'generate_ai': {
          if (!context.scopes.includes(AI_GENERATE_SCOPE)) {
            this.sendError(socket, message.id, 'Missing ai.generate scope');
            return;
          }

          const prompt = message.params?.prompt;
          if (typeof prompt !== 'string' || prompt.trim().length === 0) {
            this.sendError(
              socket,
              message.id,
              'generate_ai requires a non-empty string prompt',
            );
            return;
          }

          const completion =
            await this._automationService.generateAiCompletion(prompt);
          this.sendResult(socket, message.id, completion);
          break;
        }
        case 'agent_ask': {
          if (!context.scopes.includes(AGENT_EXECUTE_SCOPE)) {
            this.sendError(socket, message.id, 'Missing agent.execute scope');
            return;
          }

          if (!context.scopes.includes(AI_GENERATE_SCOPE)) {
            this.sendError(socket, message.id, 'Missing ai.generate scope');
            return;
          }

          const agentPrompt = message.params?.prompt;
          const outputFormat = message.params?.outputFormat;
          if (typeof agentPrompt !== 'string' || !agentPrompt.trim()) {
            this.sendError(
              socket,
              message.id,
              'agent_ask requires a non-empty prompt',
            );
            return;
          }

          const format: 'text' | 'markdown' | 'html' =
            outputFormat === 'html'
              ? 'html'
              : outputFormat === 'text'
                ? 'text'
                : 'markdown';

          const result = await this._agentService.handlePrompt(
            agentPrompt,
            context.scopes,
            format,
          );
          this.sendResult(socket, message.id, result);
          break;
        }
        default:
          this.sendError(socket, message.id, `Unknown tool: ${message.tool}`);
      }
    } catch (error) {
      this.logger.error('Error handling MCP tool call', error as Error);
      this.sendError(
        socket,
        message.id,
        error instanceof Error ? error.message : 'Unknown error occurred',
      );
    }
  }

  private sendResult(
    socket: WebSocket,
    id: string | undefined,
    result: unknown,
  ) {
    const response: McpResponse = {
      type: 'result',
      id,
      result,
    };
    socket.send(JSON.stringify(response));
  }

  private sendError(
    socket: WebSocket,
    id: string | undefined,
    message: string,
  ) {
    const response: McpResponse = {
      type: 'error',
      id,
      error: {
        message,
      },
    };
    socket.send(JSON.stringify(response));
  }

  private sendEvent(socket: WebSocket, event: string, data?: unknown) {
    const response: McpResponse = {
      type: 'event',
      event,
      data,
    };
    socket.send(JSON.stringify(response));
  }
}
