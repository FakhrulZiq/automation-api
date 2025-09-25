import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AutomationModule } from './automation/automation.module';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    HttpModule,
    AutomationModule,
  ],
})
export class AppModule {}
