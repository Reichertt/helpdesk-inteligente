import { execSync } from 'node:child_process';
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import type { GlobalSetupContext } from 'vitest/node';

let container: StartedPostgreSqlContainer;

// Sobe um PostgreSQL real em Docker e aplica as mesmas migrations (schema + dados iniciais) do ambiente.
export default async function setup({ provide }: GlobalSetupContext) {
  container = await new PostgreSqlContainer('postgres:16-alpine').start();
  const url = container.getConnectionUri();

  execSync('npx prisma migrate deploy', { env: { ...process.env, DATABASE_URL: url }, stdio: 'inherit' });
  provide('databaseUrl', url);

  return async () => {
    await container.stop();
  };
}
