import { DataSource } from "typeorm"
import * as dotenv from "dotenv"

dotenv.config()

export default new DataSource({
  type: "mysql",
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 3306,
  username: process.env.DB_USERNAME || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "chat_app_dev",
  entities: [__dirname + "/src/**/*.entity{.ts,.js}"],
  migrations: [__dirname + "/src/migrations/**/*{.ts,.js}"],
})
