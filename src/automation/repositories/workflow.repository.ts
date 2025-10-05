import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Workflow } from '../entities/workflow.entity';
import type {
  WorkflowAnalytics,
  WorkflowSummary,
} from '../interfaces/automation.interfaces';
import type { IWorkflowRepository } from '../interfaces/workflow-repository.interface';

@Injectable()
export class WorkflowRepository implements IWorkflowRepository {
  constructor(
    @InjectRepository(Workflow)
    private readonly repository: Repository<Workflow>,
  ) {}

  async findAll(): Promise<Workflow[]> {
    return this.repository.find({ order: { id: 'ASC' } });
  }

  async getAnalytics(): Promise<WorkflowAnalytics> {
    const [totalWorkflows, activeWorkflows] = await Promise.all([
      this.repository.count(),
      this.repository.count({ where: { isActive: true } }),
    ]);

    const inactiveWorkflows = totalWorkflows - activeWorkflows;
    const activePercentage =
      totalWorkflows === 0
        ? 0
        : Math.round((activeWorkflows / totalWorkflows) * 10000) / 100;

    const recentEntities = await this.repository.find({
      order: { id: 'DESC' },
      take: 5,
      select: ['id', 'name', 'isActive'],
    });

    const recentWorkflows: WorkflowSummary[] = recentEntities.map(
      ({ id, name, isActive }) => ({ id, name, isActive }),
    );

    return {
      totalWorkflows,
      activeWorkflows,
      inactiveWorkflows,
      activePercentage,
      recentWorkflows,
    };
  }
}
