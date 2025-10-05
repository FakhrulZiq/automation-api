import type { Workflow } from '../entities/workflow.entity';
import type { WorkflowAnalytics } from './automation.interfaces';

export interface IWorkflowRepository {
  findAll(): Promise<Workflow[]>;
  getAnalytics(): Promise<WorkflowAnalytics>;
}
