import { DataSource } from 'typeorm';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const entities: any[] = [];
const entitiesPath = path.join(__dirname, 'database/entities');

fs.readdirSync(entitiesPath).forEach(file => {
  if (file.endsWith('.ts') || file.endsWith('.js')) {
    const entity = require(path.join(entitiesPath, file));
    Object.values(entity).forEach(e => entities.push(e));
  }
});

const dataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities,
});

async function main() {
  await dataSource.initialize();
  const queryRunner = dataSource.createQueryRunner();

  for (const entity of entities) {
    const tableName = dataSource.getMetadata(entity).tableName;
    const result = await queryRunner.query(`SHOW TABLES LIKE '${tableName}'`);
    if (result.length === 0) {
      const migrationName = `Auto_${tableName}_${Date.now()}`;
      console.log(`📄 Table "${tableName}" chưa tồn tại → generate migration: ${migrationName}`);
      try {
        execSync(
          `npx ts-node -r tsconfig-paths/register ./node_modules/typeorm/cli.js migration:generate -d src/data-source.ts src/migrations/${migrationName}`,
          { stdio: 'inherit' }
        );
      } catch (err) {
        console.warn(`⚠️ Không có thay đổi để generate cho bảng "${tableName}"`);
      }
    } else {
      console.log(`✅ Table "${tableName}" đã tồn tại → bỏ qua`);
    }
  }

  await queryRunner.release();
  await dataSource.destroy();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
