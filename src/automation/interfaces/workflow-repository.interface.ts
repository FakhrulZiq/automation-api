import type { Workflow } from '../entities/workflow.entity';
import type { WorkflowAnalytics } from './automation.interfaces';

export const WORKFLOW_REPOSITORY = 'WORKFLOW_REPOSITORY';

export interface WorkflowRepositoryInterface {
  findAll(): Promise<Workflow[]>;
  getAnalytics(): Promise<WorkflowAnalytics>;
}
