import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

// Test the application's health endpoint
describe('GET /health', () => {
  let app: INestApplication;

  // Create and initialize the application before running tests
  beforeAll(async () => {
    // Remove the database URL to test without a database connection
    delete process.env.DATABASE_URL;

    // Load the main application module
    const mod = await Test.createTestingModule({ imports: [AppModule] }).compile();

    // Create and start the NestJS application
    app = mod.createNestApplication();
    await app.init();
  });

  // Close the application after all tests are completed
  afterAll(async () => { await app.close(); });

  // Check that the health endpoint returns a successful response
  it('returns ok', async () => {
    const res = await request(app.getHttpServer()).get('/health').expect(200);

    // Verify that the response status is "ok"
    expect(res.body.status).toBe('ok');
  });
});
