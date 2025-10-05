import {
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TYPES } from 'src/utilities/constant';
import type { Workflow } from './entities/workflow.entity';
import type {
  GenerateAiResponse,
  IAutomationService,
  OpenRouterChatResponse,
  OpenRouterMessage,
  WorkflowAnalytics,
} from './interfaces/automation.interfaces';
import type { IWorkflowRepository } from './interfaces/workflow-repository.interface';

@Injectable()
export class AutomationService implements IAutomationService {
  constructor(
    @Inject(TYPES.IWorkflowRepository)
    private readonly workflowRepository: IWorkflowRepository,
    private readonly configService: ConfigService,
  ) {}

  async listWorkflows(): Promise<Workflow[]> {
    return this.workflowRepository.findAll();
  }

  async getWorkflowAnalytics(): Promise<WorkflowAnalytics> {
    return this.workflowRepository.getAnalytics();
  }

  async generateAiCompletion(prompt: string): Promise<GenerateAiResponse> {
    const apiKey: string | undefined =
      this.configService.get<string>('OPENROUTER_API_KEY');
    if (!apiKey) {
      throw new InternalServerErrorException(
        'OpenRouter API key not configured',
      );
    }

    const apiUrl: string = this.configService.get<string>(
      'OPENROUTER_API_URL',
      'https://openrouter.ai/api/v1/chat/completions',
    );
    const model: string = this.configService.get<string>(
      'OPENROUTER_MODEL',
      'meta-llama/llama-3.1-8b-instruct',
    );
    const siteUrl: string | undefined = this.configService.get<string>(
      'OPENROUTER_SITE_URL',
    );
    const siteName: string | undefined = this.configService.get<string>(
      'OPENROUTER_SITE_NAME',
    );

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

    const messages: OpenRouterMessage[] = [
      {
        role: 'user',
        content: prompt,
      },
    ];

    const requestBody: { model: string; messages: OpenRouterMessage[] } = {
      model,
      messages,
    };

    const response: Response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new InternalServerErrorException(
        `OpenRouter request failed (${response.status} ${response.statusText})`,
      );
    }

    const data: OpenRouterChatResponse =
      (await response.json()) as OpenRouterChatResponse;
    const content: string = data?.choices?.[0]?.message?.content ?? '';

    if (!content) {
      throw new InternalServerErrorException(
        'OpenRouter response did not include content',
      );
    }

    return { content };
  }
}
