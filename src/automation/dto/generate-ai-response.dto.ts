import { ApiProperty } from '@nestjs/swagger';
import type { GenerateAiResponse } from '../interfaces/automation.interfaces';

export class GenerateAiResponseDto implements GenerateAiResponse {
  @ApiProperty({ description: 'AI generated completion content' })
  content!: string;
}
