import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('clients')
export class Client {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  industry: string;

  @Column({ nullable: true })
  subIndustry?: string;

  @Column()
  employeeCount: number;

  @Column()
  locations: number;

  @Column()
  riskLevel: 'Low' | 'Medium' | 'High';

  @Column('jsonb')
  primaryContact: {
    name: string;
    email: string;
    phone: string;
    title: string;
  };

  @Column('jsonb')
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };

  @Column({ nullable: true })
  notes?: string;

  @Column('text', { array: true, default: '{}' })
  assignedTemplateIds: string[];

  @Column({ default: 0 })
  totalAuditsCompleted: number;

  @Column({ nullable: true })
  logoUrl?: string;

  @Column({ type: 'timestamp', nullable: true })
  lastAuditDate?: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}
