# PRD-002: MVP Milestones

## Document Info
- **Version**: 1.0
- **Status**: Draft
- **Last Updated**: 2024-12

## Overview

This document breaks down the MVP into specific implementation milestones. Each milestone is a shippable increment that can be tested and validated before moving to the next.

## Milestone 1: Foundation (M1)

### Objectives
- Set up development environment
- Implement authentication
- Create basic UI shell

### Deliverables

#### 1.1 Project Setup
- [x] Monorepo structure with pnpm workspaces
- [x] TypeScript configuration
- [x] Shared types package
- [ ] Prisma schema and initial migration
- [ ] Development scripts (dev, build, test)

#### 1.2 Authentication
- [ ] Clerk integration (frontend)
- [ ] Clerk webhook handling (backend)
- [ ] User creation on first sign-in
- [ ] Protected routes

#### 1.3 Basic UI
- [ ] Mobile-responsive layout component
- [ ] Navigation (bottom tabs or header)
- [ ] Home page with CTA
- [ ] Sign in / Sign up flow

### Acceptance Criteria
- User can sign up and sign in
- User session persists across page refreshes
- UI is responsive on mobile devices

---

## Milestone 2: Call Creation (M2)

### Objectives
- Enable users to create a call request
- Store call data in database
- Basic call list view

### Deliverables

#### 2.1 Call Form
- [ ] Phone number input with validation
- [ ] Target name input (optional)
- [ ] Purpose textarea
- [ ] Form validation with error messages
- [ ] Submit button with loading state

#### 2.2 API Endpoints
- [ ] POST /api/calls - Create call
- [ ] GET /api/calls - List user's calls
- [ ] GET /api/calls/:id - Get call details

#### 2.3 Database
- [ ] Call model implementation
- [ ] CallEvent model implementation
- [ ] Database indexes for queries

#### 2.4 UI
- [ ] Calls list page
- [ ] Call card component
- [ ] Empty state design
- [ ] Call detail page (read-only)

### Acceptance Criteria
- User can fill out and submit call form
- Call appears in call list
- Call details page shows all entered information

---

## Milestone 3: Vapi Integration (M3)

### Objectives
- Connect to Vapi.ai
- Initiate outbound calls
- Basic call status updates

### Deliverables

#### 3.1 Vapi Setup
- [ ] Vapi account and API key
- [ ] Phone number provisioning
- [ ] Assistant configuration
- [ ] Webhook endpoint setup

#### 3.2 Call Initiation
- [ ] VapiService class
- [ ] Create outbound call on form submit
- [ ] Store vapiCallId in database
- [ ] Handle creation errors

#### 3.3 Webhook Handling
- [ ] POST /api/webhooks/vapi endpoint
- [ ] Signature verification
- [ ] Status update processing
- [ ] CallEvent logging

#### 3.4 Status Updates
- [ ] Update call status from webhooks
- [ ] Track call timing (startedAt, etc.)
- [ ] Basic status display in UI

### Acceptance Criteria
- Submitting form initiates real phone call via Vapi
- Call status updates reflected in database
- UI shows current call status

---

## Milestone 4: Real-time Updates (M4)

### Objectives
- WebSocket connection for live updates
- Real-time call status in UI
- Push notification infrastructure

### Deliverables

#### 4.1 WebSocket Server
- [ ] Socket.io integration
- [ ] Room management per call
- [ ] Authentication for connections
- [ ] Event broadcasting

#### 4.2 Client Integration
- [ ] Socket.io client setup
- [ ] useSocket hook
- [ ] Automatic reconnection
- [ ] Subscribe/unsubscribe on navigation

#### 4.3 Real-time UI
- [ ] Live status indicator
- [ ] Animated status transitions
- [ ] Hold time counter
- [ ] Status timeline view

#### 4.4 Notifications
- [ ] Web Push API setup
- [ ] Service worker registration
- [ ] Permission request flow
- [ ] Send notification on human detected

### Acceptance Criteria
- Call status updates appear in real-time without refresh
- User receives push notification when human available
- Hold time counter updates live

---

## Milestone 5: Call Transfer (M5)

### Objectives
- Transfer calls to user's phone
- Handle accept/decline flow
- Post-transfer cleanup

### Deliverables

#### 5.1 Transfer Flow
- [ ] User phone number in settings
- [ ] Transfer request UI
- [ ] Accept/decline buttons
- [ ] Timeout handling

#### 5.2 Vapi Transfer
- [ ] Configure transferCall tool
- [ ] Trigger transfer via Vapi API
- [ ] Handle transfer status webhooks
- [ ] Warm transfer message

#### 5.3 UI Components
- [ ] Transfer ready modal/banner
- [ ] Countdown timer
- [ ] Success/failure states
- [ ] Return to app after transfer

#### 5.4 Alternative Actions
- [ ] Decline and reschedule
- [ ] Request callback
- [ ] Take message option (basic)

### Acceptance Criteria
- User is notified when human available
- Tapping "Accept" transfers call to user's phone
- Declining returns AI to the call
- Transfer status tracked in call record

---

## Milestone 6: Polish & Launch (M6)

### Objectives
- Production readiness
- Error handling
- Performance optimization

### Deliverables

#### 6.1 Error Handling
- [ ] Global error boundary
- [ ] API error responses
- [ ] Retry logic for transient failures
- [ ] User-friendly error messages

#### 6.2 Performance
- [ ] API response caching
- [ ] Image optimization
- [ ] Bundle size analysis
- [ ] Lighthouse audit (mobile)

#### 6.3 Production Setup
- [ ] Environment configuration
- [ ] Database migration strategy
- [ ] Logging and monitoring
- [ ] Rate limiting

#### 6.4 Testing
- [ ] Unit tests for services
- [ ] API integration tests
- [ ] E2E tests for critical flows
- [ ] Manual QA checklist

#### 6.5 Documentation
- [ ] API documentation
- [ ] Deployment guide
- [ ] User guide (basic)

### Acceptance Criteria
- All critical flows have test coverage
- No console errors in production
- Lighthouse mobile score > 80
- Successful deploy to production

---

## Milestone Dependencies

```
M1 (Foundation)
 └── M2 (Call Creation)
      └── M3 (Vapi Integration)
           ├── M4 (Real-time Updates)
           └── M5 (Call Transfer)
                └── M6 (Polish & Launch)
```

## Risk Mitigation

### M3 Risks (Vapi Integration)
- **Risk**: Vapi API changes or limitations
- **Mitigation**: Build abstraction layer, have fallback provider in mind

### M4 Risks (Real-time)
- **Risk**: WebSocket scaling challenges
- **Mitigation**: Use managed Redis for Socket.io adapter

### M5 Risks (Transfer)
- **Risk**: Transfer failures lose calls
- **Mitigation**: Implement retry logic, fallback to AI continuing call

## Definition of Done

Each milestone is complete when:
1. All deliverables are implemented
2. Acceptance criteria pass
3. No critical bugs
4. Code reviewed and merged
5. Deployed to staging
6. Stakeholder sign-off

## Notes

- Milestones can overlap (e.g., start M4 while finishing M3)
- Each milestone should be deployable
- Feedback incorporated between milestones
- Scope can be adjusted based on learnings
