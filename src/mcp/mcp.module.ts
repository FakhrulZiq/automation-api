import { Module } from '@nestjs/common';
import { McpServer } from './mcp.server';
import { AutomationModule } from '../automation/automation.module';

@Module({
  imports: [AutomationModule],
  providers: [McpServer],
})
export class McpModule {}
