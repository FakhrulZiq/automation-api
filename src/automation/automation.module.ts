import { Module } from '@nestjs/common';
import { AutomationService } from './automation.service';
import { AutomationController } from './automation.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Workflow } from './entities/workflow.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Workflow])],
  providers: [AutomationService],
  controllers: [AutomationController],
})
export class AutomationModule {}
