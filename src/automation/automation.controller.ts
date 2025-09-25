import { Body, Controller, Post } from '@nestjs/common';
import type {
  AutomationService,
  TriggerWorkflowPayload,
} from './automation.service';

@Controller('automation')
export class AutomationController {
  constructor(private readonly automationService: AutomationService) {}

  @Post('trigger')
  async trigger(@Body() body: TriggerWorkflowPayload) {
    return this.automationService.triggerWorkflow(body);
  }
}
