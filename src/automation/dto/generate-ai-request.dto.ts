import { ApiProperty } from '@nestjs/swagger';
import type { GenerateAiRequest } from '../interfaces/automation.interfaces';

export class GenerateAiRequestDto implements GenerateAiRequest {
  @ApiProperty({ description: 'Prompt text sent to the OpenRouter AI', minLength: 1 })
  prompt!: string;
}
