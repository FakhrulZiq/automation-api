import type { Workflow } from '../entities/workflow.entity';

export interface GenerateAiRequest {
  prompt: string;
}

export interface GenerateAiResponse {
  content: string;
}

export interface WorkflowSummary {
  id: number;
  name: string;
  isActive: boolean;
}

export interface WorkflowAnalytics {
  totalWorkflows: number;
  activeWorkflows: number;
  inactiveWorkflows: number;
  activePercentage: number;
  recentWorkflows: WorkflowSummary[];
}

export interface IAutomationService {
  listWorkflows(): Promise<Workflow[]>;
  getWorkflowAnalytics(): Promise<WorkflowAnalytics>;
  generateAiCompletion(prompt: string): Promise<GenerateAiResponse>;
}

export interface OpenRouterMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface OpenRouterChoice {
  index: number;
  message: OpenRouterMessage;
  finish_reason: string | null;
}

export interface OpenRouterChatResponse {
  id: string;
  choices: OpenRouterChoice[];
}
