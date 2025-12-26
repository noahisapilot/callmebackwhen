# PRD-001: CallMeBackWhen Product Overview

## Document Info
- **Version**: 1.0
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
2. Navigates automated phone systems
3. Waits on hold indefinitely
4. Notifies you instantly when a human answers
5. Transfers the call to you seamlessly

## Target Users

### Primary Persona: Busy Professional
- **Demographics**: 25-55 years old, employed full-time
- **Pain points**: Cannot stay on hold during work hours
- **Needs**: Efficient way to reach customer service without losing productivity
- **Willingness to pay**: $10-30/month for time savings

### Secondary Persona: Caregiver
- **Demographics**: Managing healthcare for elderly parents or children
- **Pain points**: Frequent calls to insurance, doctors, pharmacies
- **Needs**: Help managing multiple time-consuming calls
- **Willingness to pay**: $15-40/month

### Tertiary Persona: Small Business Owner
- **Demographics**: Operates small business, limited staff
- **Pain points**: Cannot afford to have employees tied up on hold
- **Needs**: Delegate routine calls to AI
- **Willingness to pay**: $50-100/month for business tier

## Core Features

### MVP (Phase 1)

#### 1. Call Creation
- Enter phone number to call
- Provide context/reason for the call
- Select call priority (optional)
- Schedule call for later (optional)

#### 2. AI Call Handling
- Navigate IVR (phone menu) systems
- State purpose when prompted
- Wait on hold indefinitely
- Detect when human representative answers

#### 3. User Notification
- Push notification when human available
- SMS backup notification
- In-app real-time status updates
- Estimated wait time (when available)

#### 4. Call Transfer
- One-tap to accept transfer
- Warm transfer with context handoff
- Decline and request callback option
- Voice message recording option

#### 5. Call History
- List of past and active calls
- Call duration and outcome
- Recordings (where legal)
- Notes and follow-up reminders

### Phase 2 Features

#### 6. Smart Call Scheduling
- AI suggests optimal call times
- Auto-retry on disconnect
- Batch scheduling for multiple calls

#### 7. Company Directory
- Pre-configured settings for popular companies
- Optimal menu navigation paths
- Average wait time data

#### 8. Message Taking
- AI can take message if user unavailable
- Transcription and summary
- Action items extraction

#### 9. Callback Handling
- Accept callbacks on user's behalf
- Schedule callbacks for convenient times
- Handle return calls from companies

### Phase 3 Features

#### 10. Multi-party Calls
- Conference in family members
- Three-way calling support
- Interpreter assistance

#### 11. Business Features
- Team accounts
- Shared call queues
- Analytics and reporting
- CRM integration

## User Flows

### Primary Flow: Make a Call

```
1. User opens app
2. Taps "New Call"
3. Enters phone number (or selects from directory)
4. Provides call reason: "Cancel subscription"
5. Taps "Start Call"
6. AI calls the number
7. User sees real-time status:
   - "Dialing..."
   - "Connected, navigating menu..."
   - "On hold (estimated 12 min)..."
   - "Human available! Tap to connect"
8. User taps to accept
9. Call transfers to user's phone
10. User speaks with representative
```

### Secondary Flow: Scheduled Call

```
1. User creates call with schedule
2. Receives reminder before call starts
3. AI calls at scheduled time
4. Same flow as primary once human available
```

### Tertiary Flow: Decline & Message

```
1. Human becomes available
2. User is busy, taps "Take message"
3. AI informs rep: "They're unavailable, can I take a message?"
4. AI records message
5. User receives transcription
```

## Success Metrics

### North Star Metric
- **Time Saved per User per Month**: Target 2+ hours

### Primary Metrics
- Monthly Active Users (MAU)
- Calls Completed Successfully
- Average Wait Time Saved
- User Retention (30-day)

### Secondary Metrics
- Transfer Success Rate
- Human Detection Accuracy
- IVR Navigation Success Rate
- NPS Score

### Targets (6 months post-launch)
- 10,000 MAU
- 85% call completion rate
- 95% transfer success rate
- 90% human detection accuracy
- NPS > 40

## Competitive Analysis

| Feature | CallMeBackWhen | Competitors |
|---------|----------------|-------------|
| Makes calls for you | ✅ | ❌ |
| Waits on hold | ✅ | Limited |
| Transfers to you | ✅ | ❌ |
| IVR navigation | ✅ | ❌ |
| Real-time updates | ✅ | ❌ |
| Message taking | ✅ | ✅ |

### Competitive Advantages
1. **End-to-end solution**: Only product that handles entire call lifecycle
2. **AI-powered**: Intelligent IVR navigation and human detection
3. **Seamless transfer**: Warm transfer maintains call context
4. **Time savings**: Users can be productive while AI waits

## Technical Constraints

### Vapi.ai Limitations
- Warm transfer requires Twilio integration
- Some latency in real-time transcription
- Phone number costs for outbound calls

### Regulatory Considerations
- Call recording consent (two-party states)
- AI disclosure requirements (some jurisdictions)
- TCPA compliance for outbound calls

### Cost Considerations
- Per-minute costs for AI calls
- Phone number provisioning
- Transcription costs

## Pricing Strategy

### Free Tier
- 2 calls per month
- 15 min max wait time per call
- Basic notifications

### Pro Tier ($14.99/month)
- 20 calls per month
- Unlimited wait time
- Priority notifications
- Call recording
- SMS notifications

### Unlimited ($29.99/month)
- Unlimited calls
- All Pro features
- Scheduled calls
- Message taking
- Company directory

### Business ($99/month)
- Team accounts (5 users)
- Analytics
- Priority support
- API access

## Risks and Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| AI fails to detect human | High | Medium | Continuous model improvement, manual override |
| High call costs | Medium | High | Volume pricing, user limits |
| Regulatory changes | High | Low | Legal review, flexible architecture |
| Poor IVR navigation | Medium | Medium | Company-specific training, fallback to general |
| Low transfer success | High | Low | Twilio integration, multiple transfer attempts |

## Timeline

### Phase 1: MVP (Weeks 1-8)
- Weeks 1-2: Project setup, authentication
- Weeks 3-4: Core call creation and Vapi integration
- Weeks 5-6: Real-time status and notifications
- Weeks 7-8: Call transfer and history

### Phase 2: Enhancement (Weeks 9-14)
- Smart scheduling
- Company directory
- Message taking

### Phase 3: Scale (Weeks 15-20)
- Business features
- Multi-party calls
- API and integrations

## Open Questions

1. Should we build our own IVR navigation or use Vapi's assistant?
2. How do we handle calls that last longer than 1 hour?
3. What's the MVP for company directory?
4. How do we handle international calls?
5. Should AI identify itself as AI or as user's assistant?

## Appendix

### Glossary
- **IVR**: Interactive Voice Response - automated phone menus
- **Warm Transfer**: Transfer where context is provided to recipient
- **Blind Transfer**: Direct transfer without context
- **TCPA**: Telephone Consumer Protection Act

### References
- Vapi.ai Documentation: https://docs.vapi.ai
- Call center wait time statistics: [Research sources]
