# PRD-001: CallMeBackWhen Product Overview

## Document Info
- **Version**: 2.0
- **Status**: Draft
- **Last Updated**: 2024-12

## Executive Summary

CallMeBackWhen is an AI-powered personal secretary application that handles phone calls on behalf of users. The app makes outbound calls, navigates phone menus, waits on hold, and transfers the call to the user when a human representative becomes available. This saves users hours of time spent waiting on hold with customer service, healthcare providers, government agencies, and other organizations.

## Problem Statement

### The Hold Time Problem
- Average hold time for customer service calls: 13 minutes
- 67% of customers have hung up due to frustration with hold times
- Businesses lose $75 billion annually due to poor customer service
- Users often cannot stay on hold during work or other commitments

### Current Solutions Fall Short
- **Callback services**: Not all companies offer them
- **Chatbots**: Cannot handle complex issues requiring human interaction
- **Virtual assistants**: Don't make calls on your behalf
- **Hold music**: Still requires your attention

## Solution

CallMeBackWhen provides an AI secretary that:
1. Makes the call for you
2. Navigates automated phone systems (IVR)
3. Waits on hold indefinitely
4. Calls you directly when a human is available
5. Performs a warm transfer so you're connected seamlessly

## Two Operating Modes

The AI handles calls differently depending on what the IVR offers:

### Mode 1: IVR Callback Feature Detected
When the IVR system announces "Expected wait time is X minutes, press 1 to receive a callback...":

```
1. AI detects callback offer in IVR
2. AI accepts the callback option
3. AI provides OUR system number for callback
4. When company calls back, AI answers
5. AI verifies human is on the line
6. AI calls user's phone (warm transfer)
7. User speaks with representative
```

### Mode 2: Standard Hold Wait
When no callback is offered:

```
1. AI navigates IVR menus
2. AI waits on hold (indefinitely)
3. AI detects when human answers
4. AI asks human to hold briefly
5. AI calls user's phone (warm transfer)
6. If user answers: connected to rep
7. If user doesn't answer: AI tells rep "still connecting" and retries
8. AI sends SMS to user: "Pick up! Rep is waiting"
```

### User Doesn't Answer Transfer
This is critical - we don't lose the user's spot:
1. AI tells representative: "I'm connecting you with [user], one moment please"
2. AI attempts to call user's phone
3. If no answer after 15 seconds: AI tells rep "Still connecting, thank you for your patience"
4. AI sends SMS: "A representative is waiting! Please answer the next call"
5. AI retries calling user (up to 3 attempts, 30 seconds apart)
6. If all attempts fail: AI offers to take a message or schedule callback

## Target Users

### Primary Persona: Busy Professional
- **Demographics**: 25-55 years old, employed full-time
- **Pain points**: Cannot stay on hold during work hours
- **Needs**: Efficient way to reach customer service without losing productivity

### Secondary Persona: Caregiver
- **Demographics**: Managing healthcare for elderly parents or children
- **Pain points**: Frequent calls to insurance, doctors, pharmacies
- **Needs**: Help managing multiple time-consuming calls

## Core Features (MVP)

### 1. Phone Number Authentication
- Sign up with phone number
- SMS verification code
- No passwords needed
- Session persistence

### 2. Make a Call
- Enter phone number to call
- Provide reason/purpose for the call
- Start call immediately
- See real-time status updates

### 3. Real-time Call Status
- Current state: Dialing, Navigating IVR, On Hold, Human Available
- Estimated wait time (when IVR announces it)
- Live timer showing hold duration
- Push notification when human available

### 4. Automatic Transfer
- AI calls your phone directly when human is available
- Warm transfer with context handoff
- Retry logic if you don't answer
- SMS notifications to pick up

### 5. Call History
- List of past and active calls
- Call duration and outcome
- Hold time duration
- Basic call details

## User Flow

### Primary Flow: Make a Call

```
1. User opens app (first time: enters phone, verifies via SMS)
2. Taps "New Call"
3. Enters phone number to call
4. Enters reason: "Cancel my subscription"
5. Taps "Start Call"
6. Sees real-time status:
   - "Dialing..."
   - "Navigating menu..."
   - "On hold (estimated 12 min)..."
7. User's phone rings
8. User answers
9. Connected to representative
10. Call completes
11. User sees call summary in history
```

### Transfer Retry Flow

```
1. Human detected on the line
2. AI calls user's phone
3. User doesn't answer (maybe didn't see it)
4. AI tells rep: "One moment, still connecting"
5. AI sends SMS: "A rep is waiting! Answer the next call!"
6. AI calls again after 30 seconds
7. User sees SMS, answers this time
8. Connected to representative
```

## Success Metrics

### North Star Metric
- **Successful Transfers**: Calls where user connects with human

### Primary Metrics
- Transfer success rate (target: 90%+)
- Average wait time saved per call
- User retention (weekly active users)

### Secondary Metrics
- Human detection accuracy
- IVR navigation success rate
- Time to first call (new user activation)

## Pricing Strategy

### Pay-Per-Minute Model
- **Cost to us**: ~$0.03/minute (Vapi)
- **Price to user**: $0.05/minute (hold time only)
- **Minimum charge**: $1.00 per call

### Payment Flow (Pre-Authorization)
1. User adds payment method (Stripe)
2. On call creation: pre-authorize $5.00
3. During call: if approaching $5, extend authorization
4. On call end: capture actual amount used
5. Minimum capture: $1.00

### Why This Model Works
- No commitment required - try it once
- Only pay for what you use
- Aligned incentives - we only make money when we save you time
- Credit card fees manageable with $1 minimum

### Future Consideration
Once proven, could offer subscription bundles:
- $10 for 200 minutes ($0.05/min)
- $20 for 500 minutes ($0.04/min)

## Technical Constraints

### Vapi.ai Capabilities
- Outbound calls with AI assistant
- Warm transfer via transferCall tool
- Real-time transcription for human detection
- Webhook updates for call status

### Payment Processing
- Stripe for payment processing
- Pre-authorization + capture flow
- Minimum $1 capture to cover CC fees

### Regulatory Considerations
- AI disclosure: "I'm an assistant calling on behalf of [user]"
- Call recording consent varies by state
- TCPA compliance for outbound calls

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| User doesn't answer transfer | High | Retry logic + SMS notifications |
| AI fails to detect human | Medium | Conservative detection, manual override |
| High per-call costs | Medium | Volume pricing, minimum charge |
| IVR navigation fails | Medium | Fallback prompts, learning from failures |
| Payment auth expires during long hold | Low | Extend authorization when approaching limit |

## Open Questions (Resolved)

1. ✅ Two call modes: Use IVR callback when available, otherwise wait on hold
2. ✅ Notification method: Direct phone call (warm transfer)
3. ✅ User doesn't answer: Retry + SMS, keep rep on line
4. ✅ Payment model: Pre-auth with $1 minimum
5. ✅ Authentication: Phone + SMS verification

## Future Phases (Not MVP)

### Phase 2
- Scheduled calls
- Saved contacts/favorites
- Message taking when user unavailable
- Company directory with known IVR paths

### Phase 3
- Native mobile apps (iOS/Android)
- Team/business accounts
- API access
- International calling

## Appendix

### Glossary
- **IVR**: Interactive Voice Response - automated phone menus
- **Warm Transfer**: Transfer where AI provides context before connecting
- **Pre-authorization**: Holding funds on card without charging
- **Capture**: Actually charging the pre-authorized amount

### References
- Vapi.ai Documentation: https://docs.vapi.ai
- Stripe Pre-auth: https://stripe.com/docs/payments/capture-later
