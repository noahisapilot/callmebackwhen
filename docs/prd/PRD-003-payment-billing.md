# PRD-003: Payment & Billing

## Document Info
- **Version**: 1.0
- **Status**: Draft
- **Last Updated**: 2024-12

## Overview

CallMeBackWhen uses a pay-per-minute model with pre-authorization to provide a commitment-free experience while managing costs effectively.

## Pricing Model

### Per-Minute Rate
| Item | Amount |
|------|--------|
| Our cost (Vapi) | ~$0.03/minute |
| Price to user | $0.05/minute |
| Margin | $0.02/minute (40%) |

### Minimum Charge
- **Minimum per call**: $1.00
- **Rationale**: Credit card processing fees (~$0.30 + 2.9%) make micro-transactions unprofitable

### What Gets Charged
- **Hold time**: Charged at $0.05/min
- **IVR navigation**: Charged at $0.05/min
- **Transfer time**: NOT charged (once user is connected, billing stops)

### Example Costs

| Scenario | Duration | Cost |
|----------|----------|------|
| Quick resolution | 3 min | $1.00 (minimum) |
| Average call | 15 min | $0.75 → $1.00 (minimum) |
| Longer hold | 30 min | $1.50 |
| Very long hold | 60 min | $3.00 |
| Max single auth | 100 min | $5.00 |

## Payment Flow

### User Adds Payment Method

```
1. User navigates to Settings > Payment
2. App requests Stripe SetupIntent
3. User enters card details (Stripe Elements)
4. Card is validated and saved
5. User can now make calls
```

### Pre-Authorization Flow

```
1. User clicks "Start Call"
2. System checks: has valid payment method?
   - No: redirect to add payment method
   - Yes: continue
3. Create Stripe PaymentIntent:
   - Amount: $5.00 (100 minutes max)
   - capture_method: manual
   - metadata: { callId, userId }
4. PaymentIntent ID stored on Call record
5. Call proceeds
```

### During Call (Long Hold)

```
1. Call duration tracked in real-time
2. At 80 minutes (~$4.00):
   - Alert: approaching auth limit
   - Option to end call or extend
3. If user chooses extend:
   - Create new PaymentIntent for additional $5.00
   - Link to same call
4. Continue tracking
```

### Capture on Call End

```
1. Call ends (transfer complete or cancelled)
2. Calculate billable duration:
   - Start: call connected
   - End: transfer initiated (or call ended)
3. Calculate amount:
   - duration_minutes × $0.05
   - Apply $1.00 minimum
   - Round up to nearest cent
4. Capture PaymentIntent for calculated amount
5. Release any excess authorization
6. Store final amount on Call record
```

### Capture Failure Handling

```
1. Capture fails (card declined, etc.)
2. Mark call as "payment_failed"
3. Retry capture after 24 hours
4. If still fails:
   - Flag user account
   - Block new calls until resolved
5. After 7 days: write off as bad debt (log for analysis)
```

## Stripe Integration

### API Endpoints

#### Setup Intent (Add Card)
```typescript
// POST /api/payment/setup-intent
// Creates a SetupIntent for adding a new payment method

Response: {
  clientSecret: string  // For Stripe Elements
}
```

#### List Payment Methods
```typescript
// GET /api/payment/methods
// Lists user's saved payment methods

Response: {
  methods: [{
    id: string,
    brand: 'visa' | 'mastercard' | 'amex' | ...,
    last4: string,
    expMonth: number,
    expYear: number,
    isDefault: boolean
  }]
}
```

#### Delete Payment Method
```typescript
// DELETE /api/payment/methods/:id
// Removes a saved payment method

Response: { success: true }
```

#### Set Default Payment Method
```typescript
// POST /api/payment/methods/:id/default
// Sets a payment method as default

Response: { success: true }
```

### Database Schema

```prisma
model User {
  // ... existing fields
  stripeCustomerId    String?   @unique
  hasValidPayment     Boolean   @default(false)
}

model PaymentMethod {
  id              String   @id @default(cuid())
  userId          String
  user            User     @relation(fields: [userId], references: [id])

  stripePaymentMethodId  String  @unique
  brand           String   // visa, mastercard, etc.
  last4           String
  expMonth        Int
  expYear         Int
  isDefault       Boolean  @default(false)

  createdAt       DateTime @default(now())
}

model Call {
  // ... existing fields

  // Payment
  paymentIntentId     String?
  billableMinutes     Int?
  amountCharged       Int?      // cents
  paymentStatus       PaymentStatus @default(PENDING)
}

enum PaymentStatus {
  PENDING       // Auth created
  AUTHORIZED    // Funds held
  CAPTURED      // Charged
  FAILED        // Capture failed
  REFUNDED      // Refunded
  VOID          // Auth released without charge
}
```

### Stripe Webhook Events

Handle these webhook events:

| Event | Action |
|-------|--------|
| `payment_intent.succeeded` | Mark payment captured |
| `payment_intent.payment_failed` | Mark payment failed, notify user |
| `payment_method.attached` | Update user's payment methods |
| `payment_method.detached` | Remove from user's methods |
| `customer.deleted` | Clear user's Stripe data |

## UI Components

### Add Payment Method
- Full-screen modal or page
- Stripe Elements card input
- Clear "Save Card" button
- Error handling for invalid cards
- Success confirmation

### Payment Methods List
- Show all saved cards
- Card brand icon + last 4 digits
- Expiry date
- Default indicator
- Delete option (if not default)
- Set default option

### Call Cost Display
During call:
- "Current cost: $X.XX"
- Updates every minute
- Warning when approaching limit

After call:
- Final cost in call details
- In call history list

### Payment Required Gate
- Shown when user tries to call without payment method
- "Add a payment method to make calls"
- Direct link to add payment screen
- Clear explanation of pricing

## Security Considerations

### PCI Compliance
- Never handle raw card numbers
- Use Stripe Elements for card input
- Store only Stripe IDs, not card data

### Authorization
- Verify user owns payment method before operations
- Rate limit payment method additions
- Require re-auth for removing default payment method

### Fraud Prevention
- Monitor for unusual usage patterns
- Velocity checks on card additions
- Flag accounts with multiple failed payments

## Edge Cases

### Card Expires During Call
- Pre-auth was already obtained, so call continues
- Capture may fail → follow capture failure flow
- Proactive: warn users about expiring cards

### User Deletes Only Card During Call
- Block deletion while active call exists
- Or: keep card for capture, delete after

### Very Long Calls
- Max single auth: $5.00 (100 min)
- UI prompts to extend before hitting limit
- If user ignores: call continues, multiple auths created
- Extreme case (8+ hours): implement hard limit?

### Multiple Active Calls
- Each call has separate auth
- No issue as long as card limit not exceeded
- Could implement user-level concurrent call limit

### Refunds
- User disputes? Support manually issues refund
- Call dropped by our error? Automatic refund
- Via Stripe dashboard or API

## Metrics to Track

### Business Metrics
- Revenue per user
- Average call value
- Payment failure rate
- Refund rate

### Operational Metrics
- Auth success rate
- Capture success rate
- Time to capture (should be instant on call end)
- Card expiration warnings sent vs. updated

## Future Considerations

### Minute Bundles
After proving the model, offer prepaid bundles:
- $10 for 200 minutes ($0.05/min)
- $20 for 500 minutes ($0.04/min)
- $50 for 1500 minutes ($0.033/min)

Benefits:
- Lower per-minute rate for users
- Upfront revenue for us
- Reduced transaction fees

### Subscription Tier
For power users:
- $19.99/month unlimited
- Makes sense at ~400 min/month usage
- Provides predictable revenue

### Enterprise/Business
- Invoice billing
- Volume discounts
- Multiple users on one account
- Usage reporting
