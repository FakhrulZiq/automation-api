import type { Workflow } from '../entities/workflow.entity';

export interface GenerateAiRequest {
  prompt: string;
}

export interface GenerateAiResponse {
  content: string;
}

export interface AutomationServiceInterface {
  listWorkflows(): Promise<Workflow[]>;
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
