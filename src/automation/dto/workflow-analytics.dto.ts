import { ApiProperty } from '@nestjs/swagger';
import type {
  WorkflowAnalytics,
  WorkflowSummary,
} from '../interfaces/automation.interfaces';

export class WorkflowSummaryDto implements WorkflowSummary {
  @ApiProperty({ description: 'Workflow identifier' })
  id!: number;

  @ApiProperty({ description: 'Workflow name' })
  name!: string;

  @ApiProperty({ description: 'Whether the workflow is active' })
  isActive!: boolean;
}

export class WorkflowAnalyticsDto implements WorkflowAnalytics {
  @ApiProperty({ description: 'Total workflows in the system' })
  totalWorkflows!: number;

  @ApiProperty({ description: 'Number of active workflows' })
  activeWorkflows!: number;

  @ApiProperty({ description: 'Number of inactive workflows' })
  inactiveWorkflows!: number;

  @ApiProperty({ description: 'Percentage of workflows that are active' })
  activePercentage!: number;

  @ApiProperty({
    description: 'Most recently created or updated workflows',
    type: WorkflowSummaryDto,
    isArray: true,
  })
  recentWorkflows!: WorkflowSummaryDto[];
}
