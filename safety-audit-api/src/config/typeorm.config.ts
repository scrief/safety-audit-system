import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';
import { Client } from '../entities/client.entity';
import { Template } from '../entities/template.entity';
import { Audit } from '../entities/audit.entity';
import { join } from 'path';

config();

const configService = new ConfigService();

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'safety_audit_db',
  entities: [join(__dirname, '../**/*.entity{.ts,.js}')],
  migrations: ['src/migrations/*.ts'],
  ssl: false,
  extra: {
    ssl: false
  }
}); 