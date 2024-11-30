import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { Client } from './src/entities/client.entity';
import { Template } from './src/entities/template.entity';
import { Audit } from './src/entities/audit.entity';

config();

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT, 10),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [Client, Template, Audit],
  migrations: ['src/migrations/*.ts'],
  synchronize: process.env.NODE_ENV === 'development',
  ssl: false,
  extra: {
    ssl: {
      rejectUnauthorized: false
    }
  }
});

export default dataSource; 