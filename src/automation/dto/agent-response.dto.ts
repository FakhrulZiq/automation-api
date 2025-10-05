import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AgentDecisionDto {
  @ApiProperty({ description: 'Decision type', enum: ['tool', 'respond'] })
  action!: 'tool' | 'respond';

  @ApiPropertyOptional({ description: 'Tool selected by the AI if action=tool' })
  tool?: string;

  @ApiPropertyOptional({ description: 'Parameters provided for the selected tool' })
  params?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Direct response when no tool call is needed' })
  response?: string;
}

export class AgentResponseDto {
  @ApiProperty({ description: 'Structured decision returned by the AI', type: AgentDecisionDto })
  decision!: AgentDecisionDto;

  @ApiPropertyOptional({ description: 'Result returned by the executed tool (if any)' })
  toolResult?: unknown;

  @ApiProperty({ description: 'Final response produced for the user' })
  finalResponse!: string;
}
