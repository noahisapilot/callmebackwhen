# PRD-002: MVP Milestones

## Document Info
- **Version**: 2.0
- **Status**: Draft
- **Last Updated**: 2024-12

## Overview

This document breaks down the MVP into specific implementation milestones. Each milestone is a shippable increment that can be tested and validated before moving to the next.

## MVP Scope Summary

The MVP includes:
- Phone number + SMS authentication
- Make a call (enter number + reason)
- Real-time call status with estimated wait time
- Automatic warm transfer when human available
- Retry logic + SMS if user doesn't answer
- Call history
- Pay-per-minute billing with pre-authorization

---

## Milestone 1: Foundation (M1)

### Objectives
- Set up development environment
- Basic project structure
- Database schema

### Deliverables

#### 1.1 Project Setup
- [ ] Initialize monorepo with pnpm workspaces
- [ ] Configure TypeScript for all packages
- [ ] Set up ESLint + Prettier
- [ ] Configure environment variables
- [ ] Create shared types package

#### 1.2 Database Setup
- [ ] PostgreSQL database (Neon or local)
- [ ] Prisma schema with User, Call, CallEvent models
- [ ] Initial migration
- [ ] Database seed script for development

#### 1.3 Basic API Server
- [ ] Express server with TypeScript
- [ ] Health check endpoint
- [ ] Error handling middleware
- [ ] Request logging

#### 1.4 Basic Web App
- [ ] Vite + React + TypeScript setup
- [ ] Tailwind CSS configuration
- [ ] Mobile-first responsive layout
- [ ] Basic routing structure

### Acceptance Criteria
- `pnpm dev` starts all services
- Database migrations run successfully
- API responds to health check
- Web app loads on mobile viewport

---

## Milestone 2: Phone Authentication (M2)

### Objectives
- Users sign up/in with phone number
- SMS verification code
- Session management

### Deliverables

#### 2.1 SMS Provider Integration
- [ ] Twilio account setup (or alternative)
- [ ] SMS service for sending verification codes
- [ ] Rate limiting for SMS sends
- [ ] Code generation and validation logic

#### 2.2 Auth API Endpoints
- [ ] POST /api/auth/send-code - Send SMS code
- [ ] POST /api/auth/verify-code - Verify and create session
- [ ] GET /api/auth/me - Get current user
- [ ] POST /api/auth/logout - End session

#### 2.3 Session Management
- [ ] JWT token generation
- [ ] Token refresh logic
- [ ] Secure token storage (httpOnly cookies)
- [ ] Auth middleware for protected routes

#### 2.4 Auth UI
- [ ] Phone number input screen
- [ ] SMS code verification screen
- [ ] Auto-submit on code complete
- [ ] Resend code functionality
- [ ] Error states and validation

### Acceptance Criteria
- User can enter phone number and receive SMS code
- Valid code creates session and redirects to home
- Invalid code shows error
- Session persists on page refresh
- Logout clears session

---

## Milestone 3: Call Creation & Vapi Integration (M3)

### Objectives
- User can create a call request
- AI makes outbound call via Vapi
- Basic status tracking

### Deliverables

#### 3.1 Vapi Setup
- [ ] Vapi account and API key
- [ ] Phone number provisioning in Vapi
- [ ] AI Assistant configuration (prompt, voice, tools)
- [ ] Webhook endpoint for call events

#### 3.2 Call API Endpoints
- [ ] POST /api/calls - Create and start call
- [ ] GET /api/calls - List user's calls
- [ ] GET /api/calls/:id - Get call details
- [ ] DELETE /api/calls/:id - Cancel active call

#### 3.3 Vapi Service
- [ ] VapiService class with SDK integration
- [ ] Create outbound call to target number
- [ ] Store vapiCallId in database
- [ ] Handle Vapi errors gracefully

#### 3.4 Webhook Handler
- [ ] POST /api/webhooks/vapi endpoint
- [ ] Vapi signature verification
- [ ] Status update processing (started, ended, etc.)
- [ ] CallEvent logging for debugging

#### 3.5 Call Creation UI
- [ ] New call form (phone number + reason)
- [ ] Phone number formatting/validation
- [ ] Submit with loading state
- [ ] Redirect to call status page

### Acceptance Criteria
- User can submit call form
- Vapi makes real outbound call
- Call status updates in database
- Webhooks processed correctly
- User sees basic call status

---

## Milestone 4: Real-time Status & Human Detection (M4)

### Objectives
- Live call status updates in UI
- Estimated wait time display
- Human detection logic

### Deliverables

#### 4.1 WebSocket Server
- [ ] Socket.io integration with Express
- [ ] JWT authentication for connections
- [ ] Room per call for targeted updates
- [ ] Reconnection handling

#### 4.2 Real-time Events
- [ ] Emit status changes on webhook receipt
- [ ] Emit transcript updates (for human detection)
- [ ] Emit estimated wait time when detected

#### 4.3 Human Detection Logic
- [ ] Parse transcript for human indicators
- [ ] Detect callback offers in IVR
- [ ] Detect actual human vs. IVR
- [ ] Trigger transfer flow on human detected

#### 4.4 Wait Time Detection
- [ ] Parse IVR for "estimated wait time is X minutes"
- [ ] Extract and normalize wait time
- [ ] Store and display to user

#### 4.5 Status UI
- [ ] WebSocket connection hook
- [ ] Live status indicator
- [ ] Hold timer (counting up)
- [ ] Estimated wait display when available
- [ ] Status timeline/history

### Acceptance Criteria
- Status updates appear in real-time without refresh
- Hold timer counts accurately
- Estimated wait time shows when IVR announces it
- Human detection triggers next milestone flow

---

## Milestone 5: Transfer & Retry Logic (M5)

### Objectives
- Warm transfer to user's phone
- Retry if user doesn't answer
- SMS notifications

### Deliverables

#### 5.1 Transfer Flow
- [ ] Configure Vapi transferCall tool
- [ ] Trigger transfer when human detected
- [ ] AI script: "Connecting you with [user]..."
- [ ] Handle transfer success/failure webhooks

#### 5.2 Retry Logic
- [ ] Track transfer attempts
- [ ] If no answer: AI says "still connecting"
- [ ] Wait 30 seconds, retry (up to 3 times)
- [ ] After 3 failures: take message or end call

#### 5.3 SMS Notifications
- [ ] Send SMS when human detected
- [ ] Send SMS on each retry: "Pick up! Rep waiting!"
- [ ] Reuse Twilio from auth

#### 5.4 Transfer UI
- [ ] "Human available!" notification
- [ ] "Calling your phone..." status
- [ ] Retry attempt indicator
- [ ] Final outcome display

### Acceptance Criteria
- When human detected, user's phone rings
- If not answered, AI keeps rep engaged and retries
- SMS sent on each attempt
- Transfer success recorded in call history

---

## Milestone 6: Payment & Billing (M6)

### Objectives
- Stripe integration
- Pre-authorization on call start
- Capture on call end

### Deliverables

#### 6.1 Stripe Setup
- [ ] Stripe account and API keys
- [ ] Customer creation on user signup
- [ ] Payment method collection (Stripe Elements)

#### 6.2 Payment API
- [ ] POST /api/payment/setup-intent - For adding card
- [ ] GET /api/payment/methods - List user's cards
- [ ] DELETE /api/payment/methods/:id - Remove card

#### 6.3 Pre-Authorization Flow
- [ ] Before call: create PaymentIntent with capture_method=manual
- [ ] Auth for $5.00 initially
- [ ] If call approaches $5, create additional auth
- [ ] Store paymentIntentId on call record

#### 6.4 Capture Flow
- [ ] On call end: calculate duration × $0.05/min
- [ ] Apply $1.00 minimum
- [ ] Capture the amount on PaymentIntent
- [ ] Handle capture failures

#### 6.5 Payment UI
- [ ] Add payment method screen
- [ ] Payment method display on profile
- [ ] Call cost display (real-time and final)
- [ ] Receipt/history view

### Acceptance Criteria
- User can add credit card
- Call start creates hold on card
- Call end charges actual amount ($1 min)
- Failed payment blocks new calls
- User sees call costs

---

## Milestone 7: Polish & Launch (M7)

### Objectives
- Error handling
- Performance optimization
- Production deployment

### Deliverables

#### 7.1 Error Handling
- [ ] Global error boundary in React
- [ ] User-friendly error messages
- [ ] Retry logic for transient failures
- [ ] Sentry integration for error tracking

#### 7.2 Edge Cases
- [ ] Handle Vapi outages gracefully
- [ ] Handle payment declines
- [ ] Handle very long calls (>1 hour)
- [ ] Handle user cancellation mid-call

#### 7.3 Performance
- [ ] API response caching where appropriate
- [ ] Bundle size optimization
- [ ] Lighthouse mobile audit (target: 80+)

#### 7.4 Production Setup
- [ ] Vercel deployment for frontend
- [ ] Railway deployment for backend
- [ ] Neon database for production
- [ ] Environment configuration
- [ ] Domain setup

#### 7.5 Testing
- [ ] Unit tests for critical services
- [ ] Integration tests for API endpoints
- [ ] E2E tests for main user flows
- [ ] Manual QA checklist

### Acceptance Criteria
- No console errors in production
- All critical flows have test coverage
- Lighthouse mobile score > 80
- Production deploy successful
- Real calls work end-to-end

---

## Milestone Dependencies

```
M1 (Foundation)
 └── M2 (Phone Auth)
      └── M3 (Call Creation + Vapi)
           └── M4 (Real-time + Human Detection)
                └── M5 (Transfer + Retry)
                     └── M6 (Payment)
                          └── M7 (Polish & Launch)
```

Note: M6 (Payment) can be developed in parallel with M4-M5 if resources allow, just needs to be integrated before calls can be made in production.

## Risk Mitigation

### M3 Risks (Vapi)
- **Risk**: Vapi API changes or limitations
- **Mitigation**: Abstraction layer, monitor Vapi changelog

### M4 Risks (Human Detection)
- **Risk**: False positives/negatives
- **Mitigation**: Conservative detection, tunable thresholds

### M5 Risks (Transfer)
- **Risk**: Transfer drops call
- **Mitigation**: Extensive testing, fallback to message-taking

### M6 Risks (Payment)
- **Risk**: Auth expires during long hold
- **Mitigation**: Track time, extend auth proactively

## Definition of Done

Each milestone is complete when:
1. All deliverables implemented
2. Acceptance criteria pass
3. No critical bugs
4. Code reviewed
5. Deployed to staging
6. Manual testing passed
