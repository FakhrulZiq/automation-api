import { Module } from '@nestjs/common';
import { AutomationService } from 'src/automation/automation.service';
import { TYPES } from 'src/utilities/constant';
import { AuthModule } from '../auth/auth.module';
import { AutomationModule } from '../automation/automation.module';
import { McpServer } from './mcp.server';

@Module({
  imports: [AutomationModule, AuthModule],
  providers: [
    McpServer,
    {
      provide: TYPES.IAutomationService,
      useClass: AutomationService,
    },
  ],
})
export class McpModule {}
