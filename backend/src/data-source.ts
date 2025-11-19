import { DataSource } from 'typeorm';
import { entities } from './database/entities';

export const AppDataSource = new DataSource({
    type: "mysql",
    host: process.env.DB_HOST,
    port: 3306,
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    entities,
    migrations: ["dist/migrations/*.js"],
    synchronize: false,      // ❗ BẮT BUỘC
    migrationsRun: false,    // ❗ TRÁNH lỗi trùng bảng
    logging: false,
});