import { DataSource } from "typeorm";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config();

// Kiểm tra môi trường
const isTs = process.env.NODE_ENV !== "production"; // dev: ts, prod/dist: js

console.log("DB_HOST:", process.env.DB_HOST);
console.log("DB_PORT:", process.env.DB_PORT);
console.log("DB_NAME:", process.env.DB_NAME);
console.log("Running with", isTs ? "TS files" : "JS files");

export default new DataSource({
  type: "mysql",
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 3306,
  username: process.env.DB_USERNAME || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "chat_app_dev",

  // Entities: TS khi dev, JS khi build production
  entities: [
    path.join(
      __dirname,
      isTs ? "/**/*.entity.ts" : "/**/*.entity.js"
    ),
  ],

  // Migrations: TS khi dev, JS khi build production
  migrations: [
    path.join(
      __dirname,
      isTs ? "/migrations/**/*.ts" : "/migrations/**/*.js"
    ),
  ],

  synchronize: false, // production nên false
  logging: true,       // bật log để xem query khi migrate
});
