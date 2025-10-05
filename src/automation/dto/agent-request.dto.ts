import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';

export class AgentRequestDto {
  @ApiProperty({ description: 'Natural language request from the user' })
  prompt!: string;

  @ApiPropertyOptional({
    description: 'Explicit scopes to emulate for this request (testing purpose)',
    type: [String],
  })
  scopes?: string[];

  @ApiPropertyOptional({
    description: 'Desired response format',
    enum: ['text', 'markdown', 'html'],
    default: 'markdown',
  })
  outputFormat?: 'text' | 'markdown' | 'html';
}
