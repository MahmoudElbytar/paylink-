import { Controller, Get } from '@nestjs/common';
import { Client } from 'pg';

@Controller('health')
export class HealthController {
  @Get()
  async check() {
    const url = process.env.DATABASE_URL;
    if (!url) return { status: 'ok', db: 'not-configured' };
    const client = new Client({ connectionString: url, connectionTimeoutMillis: 2000 });
    try {
      await client.connect();
      await client.query('SELECT 1');
      return { status: 'ok', db: 'up' };
    } catch {
      return { status: 'degraded', db: 'down' };
    } finally {
      await client.end().catch(() => undefined);
    }
  }
}
