import { Logger } from '@aws-lambda-powertools/logger';

const logLevel = (process.env.LOG_LEVEL ?? 'INFO') as 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

export const logger = new Logger({
  serviceName: 'callmebackwhen-api',
  logLevel,
});
