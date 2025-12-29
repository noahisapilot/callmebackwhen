import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigatewayv2';
import * as apigatewayIntegrations from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import { Construct } from 'constructs';
import * as path from 'path';

interface ApiStackProps extends cdk.StackProps {
  environment: string;
}

export class ApiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    const isLocal = props.environment === 'local';

    // Common Lambda configuration
    const lambdaEnvironment = {
      NODE_OPTIONS: '--enable-source-maps',
      LOG_LEVEL: isLocal ? 'DEBUG' : 'INFO',
      DATABASE_URL: process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@host.docker.internal:5433/callmebackwhen',
      JWT_SECRET: process.env.JWT_SECRET ?? 'dev-secret-change-in-production',
      TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID ?? '',
      TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN ?? '',
      TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER ?? '',
    };

    const lambdaDefaults = {
      runtime: lambda.Runtime.NODEJS_20_X,
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      environment: lambdaEnvironment,
    };

    // Path to compiled API handlers
    const apiCodePath = path.join(__dirname, '../../packages/api/dist');

    // Auth Lambda functions
    const sendOtpFn = new lambda.Function(this, 'SendOtpFunction', {
      ...lambdaDefaults,
      functionName: `${id}-send-otp`,
      code: lambda.Code.fromAsset(apiCodePath),
      handler: 'handlers/auth/sendOtp.main',
    });

    const verifyOtpFn = new lambda.Function(this, 'VerifyOtpFunction', {
      ...lambdaDefaults,
      functionName: `${id}-verify-otp`,
      code: lambda.Code.fromAsset(apiCodePath),
      handler: 'handlers/auth/verifyOtp.main',
    });

    const logoutFn = new lambda.Function(this, 'LogoutFunction', {
      ...lambdaDefaults,
      functionName: `${id}-logout`,
      code: lambda.Code.fromAsset(apiCodePath),
      handler: 'handlers/auth/logout.main',
    });

    // User Lambda functions
    const getMeFn = new lambda.Function(this, 'GetMeFunction', {
      ...lambdaDefaults,
      functionName: `${id}-get-me`,
      code: lambda.Code.fromAsset(apiCodePath),
      handler: 'handlers/users/getMe.main',
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
