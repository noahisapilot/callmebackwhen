# User Flows

## Overview

This document details the key user journeys through the Call Me Back When application. Each flow includes the happy path, error states, and edge cases.

---

## Flow 1: New User Onboarding

### Entry Points
- Direct URL (callmebackwhen.com)
- Marketing link
- Word of mouth / referral

### Steps

```
┌─────────────────────────────────────────────────────────────┐
│                      LANDING PAGE                            │
│  "Never wait on hold again"                                 │
│                                                              │
│  [Enter your phone number]                                  │
│  [Get Started →]                                            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    OTP VERIFICATION                          │
│  We sent a code to (555) 123-4567                          │
│                                                              │
│  [_ _ _ _ _ _]                                              │
│                                                              │
│  Didn't receive it? [Resend] (available after 30s)         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      DASHBOARD                               │
│  Welcome! You're all set.                                   │
│                                                              │
│  [Make Your First Call]                                     │
│                                                              │
│  (Payment required before making calls - see Flow 7)        │
└─────────────────────────────────────────────────────────────┘
```

*Note: Payment integration is Phase 3. In Phase 1-2, users can authenticate and see the dashboard but won't be charged.*

### Error States
- **Invalid phone number**: "Please enter a valid US phone number"
- **OTP expired**: "Code expired. [Send new code]"
- **OTP incorrect**: "Incorrect code. X attempts remaining."

### Edge Cases
- User closes browser during OTP: Session persists, can resume
- User already has account: Redirect to login flow

---

## Flow 2: Initiating a Call

### Prerequisites
- User is authenticated
- User has positive balance

### Steps

```
┌─────────────────────────────────────────────────────────────┐
│                      DASHBOARD                               │
│  Balance: $5.00                                             │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Who do you need to call?                           │   │
│  │  [Enter phone number: (___) ___-____]               │   │
│  │                                                      │   │
│  │  What do you need help with?                        │   │
│  │  ┌─────────────────────────────────────────────┐   │   │
│  │  │ e.g., "I need to dispute a $47.99 charge   │   │   │
│  │  │ from December 15th on my Chase credit card" │   │   │
│  │  └─────────────────────────────────────────────┘   │   │
│  │                                                      │   │
│  │  [Start Call →]                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  Recent Calls                                               │
│  └─ No calls yet                                           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   CALL IN PROGRESS                           │
│                                                              │
│  Calling: (800) 555-1234                                    │
│  Status: Navigating menu...                                 │
│  Duration: 0:45                                             │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Live Transcript                                     │   │
│  │  ─────────────────────────────────────────────────  │   │
│  │  IVR: "Welcome to Chase. For English, press 1..."  │   │
│  │  AI: *pressed 1*                                    │   │
│  │  IVR: "Please say or enter your card number..."    │   │
│  │  AI: "I don't have that information, I'll need     │   │
│  │       to get it from the customer."                 │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  [Cancel Call]                                              │
└─────────────────────────────────────────────────────────────┘
```

### Status Progression
1. **Dialing** → "Calling (800) 555-1234..."
2. **In Menu** → "Navigating phone menu..."
3. **On Hold** → "On hold. Wait time: ~15 minutes" (if known)
4. **With Representative** → "Speaking with representative..."
5. **Transferring** → "Connecting you now..."
6. **Completed** → "Call completed"

### Error States
- **Insufficient balance**: "Add funds to continue" with quick-add buttons
- **Invalid phone number**: "Please enter a valid phone number"
- **Call failed to connect**: "Couldn't connect. The number may be invalid or busy."
- **Vapi outage**: "Service temporarily unavailable. Please try again."

---

## Flow 3: Information Request (Mid-Call SMS)

When the AI needs information from the user that wasn't in the original prompt.

### Trigger
AI encounters a question it can't answer (e.g., "What's your account PIN?")

### Steps

```
┌─────────────────────────────────────────────────────────────┐
│                        SMS                                   │
│                                                              │
│  Call Me Back When:                                         │
│  The representative is asking for your account PIN.         │
│  Please reply with just the PIN number.                     │
│                                                              │
│  User: 1234                                                 │
│                                                              │
│  Call Me Back When:                                         │
│  Got it! We've provided that to the representative.        │
└─────────────────────────────────────────────────────────────┘
```

### Parallel Dashboard Update

```
┌─────────────────────────────────────────────────────────────┐
│                   CALL IN PROGRESS                           │
│                                                              │
│  Status: ⏳ Waiting for your response                       │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  We texted you a question. Please check your phone. │   │
│  │                                                      │   │
│  │  Question: "What is your account PIN?"              │   │
│  │                                                      │   │
│  │  [Or enter here: _________] [Send]                  │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Timeout Handling
- Wait 2 minutes for SMS response
- Send reminder SMS at 1 minute
- If no response, AI tells rep: "I'll need to get my customer on the line for this"
- Initiates transfer flow

---

## Flow 4: Warm Transfer

When the user needs to speak directly with the representative.

### Trigger
- AI determines issue requires direct user involvement
- User requested transfer in original prompt
- AI couldn't get required information via SMS

### Steps

```
┌─────────────────────────────────────────────────────────────┐
│                   CALL IN PROGRESS                           │
│                                                              │
│  Status: 📞 Representative available!                       │
│                                                              │
│  We're calling you now...                                   │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Can't take the call right now?                     │   │
│  │  [Tell rep to wait 1 min]  [Continue with AI]      │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Phone Call to User

```
Incoming call from: Call Me Back When

AI: "Hi! I have a representative from Chase on the line
     regarding your credit card dispute. I've explained
     the situation to them. Are you ready to be connected?"

User: "Yes"

AI: "Great, connecting you now. The representative's name
     is Sarah."

[Call connected - AI drops off, user talks to rep directly]
```

### If User Doesn't Answer

```
┌─────────────────────────────────────────────────────────────┐
│                        SMS                                   │
│                                                              │
│  Call Me Back When:                                         │
│  A representative is ready for you! We tried calling        │
│  but couldn't reach you. We'll try again in 30 seconds.    │
│                                                              │
│  Reply READY when you can take the call, or CONTINUE        │
│  to let the AI keep handling it.                            │
└─────────────────────────────────────────────────────────────┘
```

### Retry Logic
1. First attempt: Immediate call
2. Wait 30 seconds, send SMS
3. Second attempt: Call again
4. Wait 1 minute
5. Third attempt: Final call
6. If still no answer: AI apologizes to rep, continues trying to help or schedules callback

---

## Flow 5: Callback Detection

When the IVR offers a callback instead of waiting on hold.

### Trigger
AI detects callback offer: "Expected wait time is 45 minutes. Press 1 to receive a callback..."

### Steps

```
┌─────────────────────────────────────────────────────────────┐
│                   CALL IN PROGRESS                           │
│                                                              │
│  Status: 📞 Callback requested!                             │
│                                                              │
│  The phone system offered to call us back instead of        │
│  waiting on hold. We accepted!                              │
│                                                              │
│  Expected callback: ~45 minutes                             │
│                                                              │
│  We'll notify you when they call back.                      │
│                                                              │
│  [Got it]                                                   │
└─────────────────────────────────────────────────────────────┘
```

### SMS Notification

```
Call Me Back When:
Good news! Chase will call us back in ~45 minutes instead
of waiting on hold. We'll text you when they do.

We're not charging you while waiting for the callback.
```

### When Callback Arrives

```
Call Me Back When:
Chase is calling back now! Our AI is answering and will
connect you when there's a representative ready.
```

Then proceeds to normal Flow 4 (Warm Transfer) when rep is available.

---

## Flow 6: Autonomous Resolution

When the AI fully resolves the issue without user involvement.

### Example Scenarios
- Checking business hours
- Confirming appointment times
- Getting account balance (if AI has authentication info)
- Simple information lookup

### Steps

```
┌─────────────────────────────────────────────────────────────┐
│                   CALL IN PROGRESS                           │
│                                                              │
│  Status: Speaking with representative...                    │
│  Duration: 3:22                                             │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Rep: "How can I help you today?"                   │   │
│  │  AI: "I'm calling to check if my prescription is    │   │
│  │       ready for pickup. The name is John Smith."    │   │
│  │  Rep: "Let me check... Yes, it's ready! You can    │   │
│  │       pick it up any time before 9 PM today."       │   │
│  │  AI: "Thank you so much!"                           │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    CALL COMPLETED ✓                         │
│                                                              │
│  Your issue was resolved!                                   │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Summary:                                            │   │
│  │  Your prescription is ready for pickup at CVS.      │   │
│  │  Pick up before 9 PM today.                         │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  Duration: 3:45                                             │
│  Cost: $0.19                                                │
│  Remaining balance: $4.81                                   │
│                                                              │
│  [View Full Transcript]  [Listen to Recording]              │
│                                                              │
│  How did we do? [😊] [😐] [😞]                              │
│                                                              │
│  [Make Another Call]                                        │
└─────────────────────────────────────────────────────────────┘
```

### SMS Summary

```
Call Me Back When:
✓ Call completed!

Your prescription is ready for pickup at CVS before 9 PM today.

Cost: $0.19 | Balance: $4.81
```

---

## Flow 7: Add Funds (Phase 3)

*This flow is implemented in Phase 3 when payment integration is added.*

### Trigger Points
- Balance runs low during call attempt
- Proactive top-up from settings
- First call attempt (requires minimum balance)

### Steps

```
┌─────────────────────────────────────────────────────────────┐
│                      ADD FUNDS                               │
│                                                              │
│  Current balance: $0.31                                     │
│                                                              │
│  Select amount:                                             │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐                    │
│  │   $5    │  │  $10    │  │  $25    │                    │
│  │~100 min │  │~200 min │  │~500 min │                    │
│  └─────────┘  └─────────┘  └─────────┘                    │
│                                                              │
│  Payment method:                                            │
│  [Visa •••• 4242]  [Change]                                │
│                                                              │
│  [Add $10]                                                  │
└─────────────────────────────────────────────────────────────┘
```

---

## Flow 8: View Call History

```
┌─────────────────────────────────────────────────────────────┐
│                    CALL HISTORY                              │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  📞 Chase Credit Card              Today, 2:34 PM   │   │
│  │  ✓ Resolved via transfer                            │   │
│  │  "Dispute $47.99 charge"                            │   │
│  │  Duration: 12:45 | Cost: $0.64                      │   │
│  │  [View Details]                                      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  📞 CVS Pharmacy                   Today, 11:20 AM   │   │
│  │  ✓ Resolved automatically                           │   │
│  │  "Check if prescription ready"                       │   │
│  │  Duration: 3:45 | Cost: $0.19                       │   │
│  │  [View Details]                                      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  📞 United Airlines               Yesterday, 4:15 PM │   │
│  │  ✗ Call failed - line busy                          │   │
│  │  "Change flight to December 28"                     │   │
│  │  Duration: 0:00 | Cost: $0.00                       │   │
│  │  [Try Again]                                         │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Call Detail View

```
┌─────────────────────────────────────────────────────────────┐
│                    CALL DETAILS                              │
│  ← Back                                                     │
│                                                              │
│  Chase Credit Card                                          │
│  (800) 935-9935                                             │
│  Today, 2:34 PM                                             │
│                                                              │
│  Status: ✓ Resolved via transfer                            │
│                                                              │
│  Your request:                                              │
│  "I need to dispute a $47.99 charge from December 15th"    │
│                                                              │
│  What happened:                                             │
│  • Navigated to billing disputes (0:45)                    │
│  • Waited on hold (8:30)                                   │
│  • Connected with representative Sarah                      │
│  • Transferred call to you                                  │
│  • Issue resolved                                           │
│                                                              │
│  Duration: 12:45                                            │
│  Hold time: 8:30                                            │
│  Cost: $0.64                                                │
│                                                              │
│  [▶ Listen to Recording]                                    │
│  [📄 View Transcript]                                       │
│                                                              │
│  [Call Again]                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## UI Components Summary

### Global Elements
- **Header**: Logo, Balance display, Account menu
- **Navigation**: Home, History, Settings (bottom tab bar on mobile)
- **Toast notifications**: Success/error messages

### Key States
- **Loading**: Skeleton screens, spinners
- **Empty**: Friendly illustrations with CTAs
- **Error**: Clear message with recovery action

### Responsive Design
- Mobile-first (375px base)
- Tablet/Desktop: Max-width container, larger touch targets optional
- Critical: Call initiation and live status must work perfectly on mobile

---

## Accessibility Considerations

- All interactive elements keyboard accessible
- Screen reader announcements for call status changes
- Color contrast meets WCAG AA
- Form validation announced to screen readers
- Focus management during modals and page transitions
