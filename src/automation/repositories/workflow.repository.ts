import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Workflow } from '../entities/workflow.entity';
import type { WorkflowRepositoryInterface } from '../interfaces/workflow-repository.interface';

@Injectable()
export class WorkflowRepository implements WorkflowRepositoryInterface {
  constructor(
    @InjectRepository(Workflow)
    private readonly repository: Repository<Workflow>,
  ) {}

  async findAll(): Promise<Workflow[]> {
    return this.repository.find({ order: { id: 'ASC' } });
  }
}
