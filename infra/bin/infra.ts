#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { ApiStack } from '../lib/api-stack';

const app = new cdk.App();

const env = app.node.tryGetContext('env') ?? 'local';

new ApiStack(app, `CallMeBackWhen-${env}`, {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT ?? '000000000000',
    region: process.env.CDK_DEFAULT_REGION ?? 'us-east-1',
  },
  environment: env,
});
