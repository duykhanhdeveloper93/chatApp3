import { DataSource } from 'typeorm';
import { execSync } from 'child_process';
import { entities } from './database/entities';

export const dataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities,
});

// Hàm kiểm tra table và generate migration nếu cần
export async function generateMigrationsIfNew() {
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

// Nếu chạy trực tiếp bằng `ts-node`
if (require.main === module) {
  generateMigrationsIfNew().catch(err => {
    console.error(err);
    process.exit(1);
  });
}
