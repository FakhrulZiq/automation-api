import { Workflow } from '../entities/workflow.entity';
import { WorkflowAnalytics } from './automation.interfaces';

export type ToolName = 'list_workflows' | 'workflow_analytics';

export interface IToolDefinition {
  name: ToolName;
  description: string;
}

export interface IAgentDecisionTool {
  action: 'tool';
  tool: ToolName;
  params?: Record<string, unknown>;
}

export interface IAgentDecisionRespond {
  action: 'respond';
  response: string;
}

export type AgentDecision = IAgentDecisionTool | IAgentDecisionRespond;

export interface AgentConversationResult {
  decision: AgentDecision;
  toolResult?: Workflow[] | WorkflowAnalytics | null;
  finalResponse: string;
}

type OutputFormat = 'text' | 'markdown' | 'html';

export interface IAgentService {
  handlePrompt(
    prompt: string,
    scopes: string[],
    outputFormat: OutputFormat = 'markdown',
  ): Promise<AgentConversationResult>;
}
