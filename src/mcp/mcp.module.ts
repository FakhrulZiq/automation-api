import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AutomationService } from 'src/automation/automation.service';
import { Workflow } from 'src/automation/entities/workflow.entity';
import { WorkflowRepository } from 'src/automation/repositories/workflow.repository';
import { TYPES } from 'src/utilities/constant';
import { McpServer } from './mcp.server';

@Module({
  imports: [TypeOrmModule.forFeature([Workflow])],
  providers: [
    McpServer,
    {
      provide: TYPES.IAutomationService,
      useClass: AutomationService,
    },
    {
      provide: TYPES.IWorkflowRepository,
      useClass: WorkflowRepository,
    },
  ],
})
export class McpModule {}
