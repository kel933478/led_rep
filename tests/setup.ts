import { beforeAll, afterAll, beforeEach } from '@jest/globals';
import { db } from '../server/db';
import { clients, admins, auditLogs, adminNotes, settings } from '@shared/schema';

// Test database setup
beforeAll(async () => {
  // Initialize test database tables if needed
  console.log('Setting up test database...');
});

beforeEach(async () => {
  // Clean database before each test
  await db.delete(auditLogs);
  await db.delete(adminNotes);
  await db.delete(clients);
  await db.delete(admins);
  await db.delete(settings);
});

afterAll(async () => {
  // Cleanup after all tests
  console.log('Cleaning up test database...');
});