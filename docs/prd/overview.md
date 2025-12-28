# Call Me Back When - Product Requirements Document

## Executive Summary

**Call Me Back When** is a mobile-optimized web application that eliminates the frustration of waiting on hold. Users provide a phone number and describe what they need, and our AI-powered system handles the call—navigating IVR menus, waiting on hold, and either resolving the issue autonomously or seamlessly transferring the user when a human representative is needed.

## Problem Statement

Americans spend an estimated 900 million hours per year on hold. This represents:
- Lost productivity for individuals and businesses
- Frustration and poor customer experience
- Wasted time that could be spent on meaningful activities

Current solutions are inadequate:
- Callback features are inconsistent and not universally available
- Virtual hold services are expensive and require subscriptions
- No solution intelligently handles the call or attempts to resolve issues autonomously

## Solution

A simple, pay-per-minute service that:
1. Calls any phone number on the user's behalf
2. Navigates IVR systems intelligently using AI
3. Waits on hold (or uses callback features when available)
4. Attempts to resolve the user's issue autonomously when possible
5. Transfers to the user via warm handoff when human interaction is required
6. Handles mid-call information requests via SMS when the user isn't needed on the line

## Target Users

### Primary Persona: Busy Professional
- Ages 25-55
- Values time highly
- Frequently needs to contact customer service (banks, airlines, insurance, utilities)
- Comfortable with mobile apps and digital payments

### Secondary Persona: Caregiver/Assistant
- Managing calls for family members or clients
- Needs to handle multiple service calls
- Appreciates detailed call logs and history

## Core Features (MVP)

### 1. Call Initiation
- **Phone Number Input**: User enters the business phone number they want to call
- **Prompt/Goal Description**: User describes what they're trying to achieve in natural language
  - Example: "I need to dispute a charge of $47.99 from December 15th on my credit card"
  - Example: "Check if my prescription is ready for pickup"
  - Example: "Cancel my subscription and get a refund for this month"

### 2. AI-Powered Call Handling
The AI system handles calls with three possible outcomes:

#### Outcome A: Autonomous Resolution
- AI resolves the issue without user involvement
- Example: "What are your holiday hours?" → AI gets answer, reports back to user
- User receives SMS/notification with the result

#### Outcome B: Information Relay
- Business needs information the AI doesn't have
- AI texts user to request the information
- User responds via SMS
- AI relays the answer to the business
- Example: "What's your account PIN?" → AI texts user → User replies "1234" → AI provides to rep

#### Outcome C: Warm Transfer
- Issue requires direct user involvement
- AI notifies user that a representative is available
- System calls user's phone for warm transfer
- AI introduces the situation to both parties
- If user doesn't answer: AI continues handling, sends SMS, retries calling

### 3. Callback Detection
- AI monitors for callback offers from IVR systems
- When detected ("Expected wait time is 45 minutes, press 1 for a callback...")
- AI accepts callback on user's behalf
- Notifies user of expected callback time
- Handles callback when it arrives using same logic

### 4. Live Call Dashboard
- Real-time status of active calls
- Current duration on hold
- Expected wait time (when IVR provides it)
- Transcript of AI interactions
- Quick actions: Cancel call, Request transfer now

### 5. Call History & Logs
- Complete history of all calls
- Call recordings (via Vapi)
- Transcripts
- Outcome summary
- Duration and cost breakdown

### 6. User Account
- SMS OTP authentication (phone number based)
- Pre-funded balance system
- Transaction history
- Saved phone number (for transfers)

## Pricing Model

### Pay-Per-Minute
- **User Cost**: $0.05 per minute
- **Provider Cost**: ~$0.03 per minute (Vapi)
- **Margin**: ~$0.02 per minute (40%)

### Pre-Funded Balance
- Minimum top-up: $5
- Available increments: $5, $10, $25
- Bonus credits at higher tiers (future consideration)
- Balance never expires

### What's Charged
- Time on hold waiting for representative
- Time during IVR navigation
- Time while AI handles the call
- **Not charged**: Time while user is on the transferred call

## Success Metrics

### Primary KPIs
- **Call Success Rate**: % of calls that achieve user's stated goal
- **User Satisfaction**: Post-call rating (1-5 stars)
- **Time Saved**: Average hold time handled by AI per call

### Secondary KPIs
- User retention (weekly/monthly active users)
- Average balance top-up amount
- Calls per user per month
- Autonomous resolution rate (no transfer needed)

## Constraints & Assumptions

### Constraints
- US phone numbers only (MVP)
- English language only (MVP)
- Web app only (native apps post-MVP)

### Assumptions
- Users have a smartphone with SMS capability
- Users have a payment method compatible with Stripe
- Vapi.ai can reliably handle IVR navigation and hold detection

## Future Considerations (Post-MVP)

1. **Business Directory**: Pre-populated list of common hold-heavy numbers
2. **Scheduled Calls**: "Call my insurance company tomorrow at 9 AM"
3. **Native Mobile Apps**: iOS and Android
4. **Team/Family Plans**: Shared balance, multiple users
5. **API Access**: For businesses to integrate
6. **International Support**: UK, Canada, etc.
7. **Multi-language Support**: Spanish, French, etc.

## Risks & Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Vapi reliability issues | High | Medium | Monitor closely, have fallback provider identified |
| Users abuse for spam/fraud | High | Low | Rate limiting, phone verification, usage monitoring |
| Low autonomous resolution rate | Medium | Medium | Iterate on prompts, collect training data |
| Payment fraud | Medium | Low | Stripe Radar, velocity checks |
| Regulatory issues (call recording) | Medium | Low | Clear consent, comply with state laws |

## Timeline

### Phase 1: Foundation (Current)
- PRD and technical documentation
- Project setup and infrastructure
- Core authentication flow

### Phase 2: Core Functionality
- Vapi integration
- Basic call flow (dial, wait, transfer)
- Simple dashboard

### Phase 3: Intelligence
- IVR navigation
- Callback detection
- Autonomous resolution attempts

### Phase 4: Polish & Launch
- Payment integration
- Call history and recordings
- Beta testing
- Public launch

## Appendix

### Competitive Landscape
- **Traditional Callback Services**: Expensive, subscription-based
- **Virtual Assistants**: General purpose, not optimized for hold waiting
- **IVR Callback Features**: Inconsistent, not always available

### Regulatory Considerations
- Call recording consent (two-party consent states)
- Payment processing compliance (PCI-DSS via Stripe)
- Terms of service for AI representation
