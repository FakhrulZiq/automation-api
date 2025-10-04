import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity({ name: 'workflows' })
export class Workflow {
  @ApiProperty({ description: 'Workflow identifier' })
  @PrimaryGeneratedColumn()
  id!: number;

  @ApiProperty({ description: 'Human readable workflow name', maxLength: 120 })
  @Column({ length: 120 })
  name!: string;

  @ApiProperty({ description: 'Optional workflow description', required: false })
  @Column({ type: 'text', nullable: true })
  description?: string;

  @ApiProperty({ description: 'Indicates whether the workflow is active' })
  @Column({ name: 'is_active', default: true })
  isActive!: boolean;
}
