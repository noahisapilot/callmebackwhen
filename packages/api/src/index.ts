// Auth handlers
export { main as sendOtp } from './handlers/auth/sendOtp.js';
export { main as verifyOtp } from './handlers/auth/verifyOtp.js';
export { main as logout } from './handlers/auth/logout.js';

// User handlers
export { main as getMe } from './handlers/users/getMe.js';

// Lib exports
export * from './lib/errors.js';
export * from './lib/jwt.js';
export * from './lib/logger.js';
export * from './lib/response.js';
