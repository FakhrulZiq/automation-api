import { Module } from '@nestjs/common';
import { AutomationService } from './automation.service';
import { AutomationController } from './automation.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Workflow } from './entities/workflow.entity';
import { WorkflowRepository } from './repositories/workflow.repository';
import { WORKFLOW_REPOSITORY } from './interfaces/workflow-repository.interface';

@Module({
  imports: [TypeOrmModule.forFeature([Workflow])],
  providers: [
    AutomationService,
    {
      provide: WORKFLOW_REPOSITORY,
      useClass: WorkflowRepository,
    },
  ],
  controllers: [AutomationController],
})
export class AutomationModule {}
