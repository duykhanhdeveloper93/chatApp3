import { DataSource } from 'typeorm';
import { entities } from './database/entities';

export const dataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities,
  synchronize: true,   // ✅ AUTO CREATE / UPDATE TABLE
  logging: true,       // bật log cho dễ debug
});
