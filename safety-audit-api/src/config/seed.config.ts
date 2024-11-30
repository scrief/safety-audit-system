import { DataSource } from 'typeorm';
import { SeederOptions } from 'typeorm-extension';
import { config } from 'dotenv';
import { Client } from '../entities/client.entity';
import { Template } from '../entities/template.entity';
import { Audit } from '../entities/audit.entity';

config();

const options: SeederOptions = {
  seeds: ['src/seeds/**/*{.ts,.js}'],
  factories: []
};

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'safety_audit_db',
  entities: [Client, Template, Audit],
  ssl: false
});

export { dataSource, options }; 