import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigatewayv2';
import * as apigatewayIntegrations from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import * as path from 'path';

interface ApiStackProps extends cdk.StackProps {
  environment: string;
}

export class ApiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    const isLocal = props.environment === 'local';

    // Common Lambda environment
    const lambdaEnvironment = {
      NODE_OPTIONS: '--enable-source-maps',
      LOG_LEVEL: isLocal ? 'DEBUG' : 'INFO',
      DATABASE_URL:
        process.env.DATABASE_URL ??
        'postgresql://postgres:postgres@host.docker.internal:5433/callmebackwhen',
      JWT_SECRET: process.env.JWT_SECRET ?? 'dev-secret-change-in-production',
      TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID ?? '',
      TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN ?? '',
      TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER ?? '',
    };

    // Path to API source files
    const apiSrcPath = path.join(__dirname, '../../packages/api/src');

    // Common bundling options
    const bundlingOptions = {
      minify: !isLocal,
      sourceMap: true,
      externalModules: [] as string[], // Bundle everything
    };

    // Auth Lambda functions
    const sendOtpFn = new NodejsFunction(this, 'SendOtpFunction', {
      functionName: `${id}-send-otp`,
      runtime: Runtime.NODEJS_20_X,
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      environment: lambdaEnvironment,
      entry: path.join(apiSrcPath, 'handlers/auth/sendOtp.ts'),
      handler: 'main',
      bundling: bundlingOptions,
    });

    const verifyOtpFn = new NodejsFunction(this, 'VerifyOtpFunction', {
      functionName: `${id}-verify-otp`,
      runtime: Runtime.NODEJS_20_X,
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      environment: lambdaEnvironment,
      entry: path.join(apiSrcPath, 'handlers/auth/verifyOtp.ts'),
      handler: 'main',
      bundling: bundlingOptions,
    });

    const logoutFn = new NodejsFunction(this, 'LogoutFunction', {
      functionName: `${id}-logout`,
      runtime: Runtime.NODEJS_20_X,
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      environment: lambdaEnvironment,
      entry: path.join(apiSrcPath, 'handlers/auth/logout.ts'),
      handler: 'main',
      bundling: bundlingOptions,
    });

    // User Lambda functions
    const getMeFn = new NodejsFunction(this, 'GetMeFunction', {
      functionName: `${id}-get-me`,
      runtime: Runtime.NODEJS_20_X,
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      environment: lambdaEnvironment,
      entry: path.join(apiSrcPath, 'handlers/users/getMe.ts'),
      handler: 'main',
      bundling: bundlingOptions,
    });

    // HTTP API Gateway
    const httpApi = new apigateway.HttpApi(this, 'HttpApi', {
      apiName: `${id}-api`,
      corsPreflight: {
        allowHeaders: ['Content-Type', 'Authorization'],
        allowMethods: [
          apigateway.CorsHttpMethod.GET,
          apigateway.CorsHttpMethod.POST,
          apigateway.CorsHttpMethod.PUT,
          apigateway.CorsHttpMethod.PATCH,
          apigateway.CorsHttpMethod.DELETE,
          apigateway.CorsHttpMethod.OPTIONS,
        ],
        allowOrigins: ['*'], // TODO: Restrict in production
        maxAge: cdk.Duration.days(1),
      },
    });

    // Auth routes
    httpApi.addRoutes({
      path: '/auth/send-otp',
      methods: [apigateway.HttpMethod.POST],
      integration: new apigatewayIntegrations.HttpLambdaIntegration('SendOtp', sendOtpFn),
    });

    httpApi.addRoutes({
      path: '/auth/verify-otp',
      methods: [apigateway.HttpMethod.POST],
      integration: new apigatewayIntegrations.HttpLambdaIntegration('VerifyOtp', verifyOtpFn),
    });

    httpApi.addRoutes({
      path: '/auth/logout',
      methods: [apigateway.HttpMethod.POST],
      integration: new apigatewayIntegrations.HttpLambdaIntegration('Logout', logoutFn),
    });

    // User routes
    httpApi.addRoutes({
      path: '/users/me',
      methods: [apigateway.HttpMethod.GET],
      integration: new apigatewayIntegrations.HttpLambdaIntegration('GetMe', getMeFn),
    });

    // S3 bucket for frontend static hosting
    const websiteBucket = new s3.Bucket(this, 'WebsiteBucket', {
      bucketName: isLocal ? undefined : `${id.toLowerCase()}-website`,
      websiteIndexDocument: 'index.html',
      websiteErrorDocument: 'index.html', // SPA routing
      publicReadAccess: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ACLS,
      removalPolicy: isLocal ? cdk.RemovalPolicy.DESTROY : cdk.RemovalPolicy.RETAIN,
      autoDeleteObjects: isLocal,
    });

    // CloudFront distribution (skip for local)
    if (!isLocal) {
      const distribution = new cloudfront.Distribution(this, 'Distribution', {
        defaultBehavior: {
          origin: new origins.S3Origin(websiteBucket),
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        },
        defaultRootObject: 'index.html',
        errorResponses: [
          {
            httpStatus: 404,
            responseHttpStatus: 200,
            responsePagePath: '/index.html',
          },
        ],
      });

      new cdk.CfnOutput(this, 'DistributionDomainName', {
        value: distribution.distributionDomainName,
        description: 'CloudFront distribution domain name',
      });
    }

    // Outputs
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: httpApi.apiEndpoint,
      description: 'HTTP API endpoint URL',
    });

    new cdk.CfnOutput(this, 'WebsiteBucketName', {
      value: websiteBucket.bucketName,
      description: 'S3 bucket for website hosting',
    });

    if (isLocal) {
      new cdk.CfnOutput(this, 'WebsiteUrl', {
        value: websiteBucket.bucketWebsiteUrl,
        description: 'Website URL (LocalStack)',
      });
    }
  }
}
