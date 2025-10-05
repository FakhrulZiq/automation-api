import { Module } from '@nestjs/common';
import { AutomationService } from './automation.service';
import { AutomationController } from './automation.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Workflow } from './entities/workflow.entity';
import { WorkflowRepository } from './repositories/workflow.repository';
import { TYPES } from 'src/utilities/constant';
import { AgentService } from './agent.service';

@Module({
  imports: [TypeOrmModule.forFeature([Workflow])],
  providers: [
    AutomationService,
    WorkflowRepository,
    AgentService,
    {
      provide: TYPES.IAutomationService,
      useClass: AutomationService,
    },
    {
      provide: TYPES.IWorkflowRepository,
      useClass: WorkflowRepository,
    },
  ],
  controllers: [AutomationController],
  exports: [AutomationService, AgentService],
})
export class AutomationModule {}
