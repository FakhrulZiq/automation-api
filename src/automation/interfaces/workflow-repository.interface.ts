import type { Workflow } from '../entities/workflow.entity';

export const WORKFLOW_REPOSITORY = 'WORKFLOW_REPOSITORY';

export interface WorkflowRepositoryInterface {
  findAll(): Promise<Workflow[]>;
}
