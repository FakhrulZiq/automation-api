import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AutomationService } from './automation.service';
import type { Workflow } from './entities/workflow.entity';
import {
  AgentConversationResult,
  AgentDecision,
  IAgentService,
  IToolDefinition,
  OutputFormat,
  ToolName,
} from './interfaces/agent.interfaces';
import type { WorkflowAnalytics } from './interfaces/automation.interfaces';

@Injectable()
export class AgentService implements IAgentService {
  private readonly logger = new Logger(AgentService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly automationService: AutomationService,
  ) {}

  async handlePrompt(
    prompt: string,
    scopes: string[],
    outputFormat: OutputFormat = 'markdown',
  ): Promise<AgentConversationResult> {
    if (!scopes.includes('ai.generate')) {
      throw new UnauthorizedException(
        'ai.generate scope required to use the agent',
      );
    }

    const tools = this.buildToolCatalog(scopes);
    if (tools.length === 0) {
      throw new UnauthorizedException(
        'No tools available for the current user scope',
      );
    }

    const decision = await this.requestToolDecision(prompt, tools);

    if (decision.action === 'respond') {
      return {
        decision,
        toolResult: null,
        finalResponse: decision.response,
      };
    }

    if (!tools.some((tool) => tool.name === decision.tool)) {
      throw new UnauthorizedException(`Tool ${decision.tool} is not permitted`);
    }

    const toolResult = await this.executeTool(decision.tool);

    const finalResponse = await this.requestFinalResponse(
      prompt,
      decision.tool,
      toolResult,
      outputFormat,
    );

    return {
      decision,
      toolResult,
      finalResponse,
    };
  }

  private buildToolCatalog(scopes: string[]): IToolDefinition[] {
    const tools: IToolDefinition[] = [];

    if (scopes.includes('workflow.read')) {
      tools.push({
        name: 'list_workflows',
        description: 'Return all workflows with their metadata.',
      });
    }

    if (scopes.includes('analytics.read')) {
      tools.push({
        name: 'workflow_analytics',
        description: 'Return aggregate workflow statistics.',
      });
    }

    return tools;
  }

  private async requestToolDecision(
    prompt: string,
    tools: IToolDefinition[],
  ): Promise<AgentDecision> {
    const toolListJson = JSON.stringify(tools, null, 2);
    const systemContent = `You are an AI orchestration planner. Available tools: ${toolListJson}.
Respond with strict JSON using one of the following shapes:
1. {"action":"tool","tool":"<toolName>","params":{}}
2. {"action":"respond","response":"<text>"}
Do not include any additional text.`;

    const response = await this.invokeOpenRouter([
      { role: 'system', content: systemContent },
      { role: 'user', content: prompt },
    ]);

    try {
      const parsed = JSON.parse(response) as AgentDecision;
      if (
        parsed.action === 'tool' &&
        parsed.tool &&
        ['list_workflows', 'workflow_analytics'].includes(parsed.tool)
      ) {
        return parsed;
      }

      if (parsed.action === 'respond' && typeof parsed.response === 'string') {
        return parsed;
      }

      throw new Error('Decision shape invalid');
    } catch (error) {
      this.logger.error(
        'Failed to parse agent decision',
        error as Error,
        response,
      );
      throw new BadRequestException(
        'Failed to parse agent decision from model response',
      );
    }
  }

  private async executeTool(
    tool: ToolName,
  ): Promise<Workflow[] | WorkflowAnalytics> {
    switch (tool) {
      case 'list_workflows':
        return this.automationService.listWorkflows();
      case 'workflow_analytics':
        return this.automationService.getWorkflowAnalytics();
      default:
        throw new BadRequestException(`Unsupported tool: ${tool}`);
    }
  }

  private async requestFinalResponse(
    prompt: string,
    tool: ToolName,
    result: Workflow[] | WorkflowAnalytics,
    outputFormat: OutputFormat,
  ): Promise<string> {
    const formatInstruction =
      outputFormat === 'html'
        ? 'Return a self-contained HTML snippet. Use semantic HTML elements.'
        : outputFormat === 'markdown'
          ? 'Return a markdown formatted answer.'
          : 'Return plain text.';

    const systemContent = `You are an AI assistant creating user-facing answers.
${formatInstruction}`;

    const userContent = `User question: ${prompt}
Tool used: ${tool}
Tool result JSON:
${JSON.stringify(result, null, 2)}`;

    return this.invokeOpenRouter([
      { role: 'system', content: systemContent },
      { role: 'user', content: userContent },
    ]);
  }

  private async invokeOpenRouter(
    messages: Array<{ role: 'system' | 'user'; content: string }>,
  ): Promise<string> {
    const apiKey = this.configService.get<string>('OPENROUTER_API_KEY');
    if (!apiKey) {
      throw new InternalServerErrorException(
        'OpenRouter API key not configured',
      );
    }

    const apiUrl = this.configService.get<string>(
      'OPENROUTER_API_URL',
      'https://openrouter.ai/api/v1/chat/completions',
    );
    const model = this.configService.get<string>(
      'OPENROUTER_MODEL',
      'meta-llama/llama-3.1-8b-instruct',
    );
    const siteUrl = this.configService.get<string>('OPENROUTER_SITE_URL');
    const siteName = this.configService.get<string>('OPENROUTER_SITE_NAME');

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    };

    if (siteUrl) {
      headers['HTTP-Referer'] = siteUrl;
    }

    if (siteName) {
      headers['X-Title'] = siteName;
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({ model, messages }),
    });

    if (!response.ok) {
      throw new InternalServerErrorException(
        `OpenRouter request failed (${response.status} ${response.statusText})`,
      );
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data?.choices?.[0]?.message?.content;

    if (!content) {
      throw new InternalServerErrorException(
        'OpenRouter response did not include content',
      );
    }

    return content;
  }
}
