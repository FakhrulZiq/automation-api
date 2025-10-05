import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AutomationService } from '../automation/automation.service';
import type { CallToolRequest, McpRequest, McpResponse } from './mcp.types';
import { WebSocketServer } from 'ws';
import type { RawData, WebSocket } from 'ws';

@Injectable()
export class McpServer implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(McpServer.name);
  private server?: WebSocketServer;

  constructor(
    private readonly configService: ConfigService,
    private readonly automationService: AutomationService,
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

      socket.on('message', async (data: RawData) => {
        await this.handleMessage(socket, data);
      });

      socket.on('close', () => {
        this.logger.log('Client disconnected from MCP server');
      });
    });

    this.logger.log(`MCP server listening on ws://${host}:${port}`);
  }

  onModuleDestroy(): void {
    if (this.server) {
      this.server.close();
      this.server = undefined;
    }
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
      case 'list_tools':
        this.handleListTools(socket, payload.id);
        break;
      case 'call_tool':
        await this.handleCallTool(socket, payload);
        break;
      case 'ping':
        this.sendResult(socket, payload.id, { pong: true });
        break;
      default: {
        const unsupported = payload as McpRequest;
        this.sendError(
          socket,
          unsupported.id,
          `Unsupported MCP message type: ${unsupported.type}`,
        );
      }
    }
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
    this.sendResult(socket, id, {
      tools: [
        {
          name: 'list_workflows',
          description:
            'Returns all workflows stored in the automation database.',
          input_schema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'workflow_analytics',
          description: 'Provides aggregate statistics about workflows.',
          input_schema: {
            type: 'object',
            properties: {},
          },
        },
        {
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
        },
      ],
    });
  }

  private async handleCallTool(socket: WebSocket, message: CallToolRequest) {
    try {
      switch (message.tool) {
        case 'list_workflows': {
          const workflows = await this.automationService.listWorkflows();
          this.sendResult(socket, message.id, { workflows });
          break;
        }
        case 'workflow_analytics': {
          const analytics = await this.automationService.getWorkflowAnalytics();
          this.sendResult(socket, message.id, analytics);
          break;
        }
        case 'generate_ai': {
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
            await this.automationService.generateAiCompletion(prompt);
          this.sendResult(socket, message.id, completion);
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
