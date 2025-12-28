import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { User } from './entities/User.js';
import { OtpCode } from './entities/OtpCode.js';
import { Call } from './entities/Call.js';
import { CallEvent } from './entities/CallEvent.js';
import { Transaction } from './entities/Transaction.js';

const isProduction = process.env.NODE_ENV === 'production';

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  synchronize: false, // Never use in production, use migrations
  logging: !isProduction,
  entities: [User, OtpCode, Call, CallEvent, Transaction],
  migrations: ['dist/migrations/*.js'],
  migrationsTableName: 'migrations',
  ssl: isProduction ? { rejectUnauthorized: false } : false,
});

// For Lambda - reuse connection if warm
let initialized = false;

export async function getDataSource(): Promise<DataSource> {
  if (!initialized) {
    await AppDataSource.initialize();
    initialized = true;
  }
  return AppDataSource;
}
