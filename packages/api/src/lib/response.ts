import type { APIGatewayProxyResult } from 'aws-lambda';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*', // TODO: Restrict in production
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
  'Content-Type': 'application/json',
};

export function success<T>(data: T, statusCode = 200): APIGatewayProxyResult {
  return {
    statusCode,
    headers: CORS_HEADERS,
    body: JSON.stringify(data),
  };
}

export function error(
  code: string,
  message: string,
  statusCode = 400
): APIGatewayProxyResult {
  return {
    statusCode,
    headers: CORS_HEADERS,
    body: JSON.stringify({
      error: { code, message },
    }),
  };
}

export function corsPreflightResponse(): APIGatewayProxyResult {
  return {
    statusCode: 200,
    headers: CORS_HEADERS,
    body: '',
  };
}
