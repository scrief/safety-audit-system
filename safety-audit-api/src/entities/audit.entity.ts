import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Client } from './client.entity';
import { Template } from './template.entity';

@Entity('audits')
export class Audit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  clientId: string;

  @Column({ type: 'uuid' })
  templateId: string;

  @Column()
  templateName: string;

  @Column()
  auditorName: string;

  @Column({ nullable: true })
  auditorTitle: string;

  @Column({ nullable: true })
  auditorEmail: string;

  @Column({ 
    type: 'enum', 
    enum: ['draft', 'completed'], 
    default: 'draft' 
  })
  status: 'draft' | 'completed';

  @Column('jsonb', { nullable: true, default: '{}' })
  responses: Record<string, any>;

  @Column('jsonb', { nullable: true })
  sections: Array<{
    id: string;
    title: string;
  }>;

  @Column('jsonb', { nullable: true })
  fields: Array<{
    id: string;
    sectionId: string;
    question: string;
    type: string;
    required: boolean;
  }>;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  @ManyToOne(() => Client, { eager: true })
  @JoinColumn({ name: 'clientId' })
  client: Client;

  @ManyToOne(() => Template)
  @JoinColumn({ name: 'templateId' })
  template: Template;
}
