import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
} from '@nestjs/common';
import { ApiBody, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AutomationService } from './automation.service';
import type {
  GenerateAiResponse,
  WorkflowAnalytics,
} from './interfaces/automation.interfaces';
import { Workflow } from './entities/workflow.entity';
import { GenerateAiRequestDto } from './dto/generate-ai-request.dto';
import { GenerateAiResponseDto } from './dto/generate-ai-response.dto';
import { WorkflowAnalyticsDto } from './dto/workflow-analytics.dto';

@ApiTags('automation')
@Controller('automation')
export class AutomationController {
  constructor(private readonly automationService: AutomationService) {}

  @Get('workflows')
  @ApiOperation({
    summary: 'List workflows',
    description: 'Retrieves all workflows from PostgreSQL.',
  })
  @ApiOkResponse({ type: Workflow, isArray: true })
  async listWorkflows(): Promise<Workflow[]> {
    return this.automationService.listWorkflows();
  }

  @Get('analytics')
  @ApiOperation({
    summary: 'Workflow analytics',
    description: 'Aggregated statistics for workflows stored in the database.',
  })
  @ApiOkResponse({ type: WorkflowAnalyticsDto })
  async getAnalytics(): Promise<WorkflowAnalytics> {
    return this.automationService.getWorkflowAnalytics();
  }

  @Post('ai')
  @ApiOperation({
    summary: 'Generate AI completion',
    description:
      'Sends a prompt to OpenRouter and returns the generated content.',
  })
  @ApiBody({ type: GenerateAiRequestDto })
  @ApiOkResponse({ type: GenerateAiResponseDto })
  async generateAi(
    @Body() body: GenerateAiRequestDto,
  ): Promise<GenerateAiResponse> {
    if (!body.prompt?.trim()) {
      throw new BadRequestException('prompt must not be empty');
    }

    return this.automationService.generateAiCompletion(body.prompt);
  }
}
