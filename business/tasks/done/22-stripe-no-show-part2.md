Step 3: Frontend Client Widget (The reservationBlock)
In Step 3 (Contact Capture) or a new Step 4 of your public booking flow, you will embed Stripe Elements to capture the card securely without the data ever touching your Azure Blob infrastructure.

Call the API: Before rendering the payment form, your widget calls your Azure Function /api/availability or a new /api/setup-intent passing the clientId.

Initialize Elements: The Azure Function calls Stripe to create a SetupIntent, passing the tenant’s connected account ID in the header:

// Inside Azure Function
const setupIntent = await stripe.setupIntents.create({
  payment_method_types: ['card'],
  usage: 'off_session', // Crucial: allows charging the card later
}, {
  stripeAccount: tenantStripeUserId // Routes the setup to the tenant's Stripe account
});


3. **Mount the Card Input:** Send the `client_secret` from that intent back to the frontend. Use the `@stripe/react-stripe-js` library to mount the `CardElement` or `PaymentElement`.
4. **Confirm Card:** When the user clicks "Confirm Booking," call `stripe.confirmCardSetup()`. Stripe validates the card (and handles 3D Secure / SCA verification if required by European banks).

---

## Step 4: Save the Booking Token to Cosmos DB
Once the card setup is successful, Stripe returns a `setupIntent` object to your frontend containing a `payment_method` ID (e.g., `pm_12345`).

1. **Submit the Payload:** Send the reservation data along with the `payment_method` ID to your production endpoint: `POST /api/reservation`.
2. **Cosmos DB Storage:** Your Azure Function validates the payload against `reservationBlock.schema.json` and updates the reservation document:

```json
{
  "id": "res_98765",
  "clientId": "barber-mike",
  "status": "confirmed",
  "guestDetails": { "name": "John Doe", "email": "john@example.com" },
  "guarantee": {
    "paymentMethodId": "pm_12345",
    "status": "vaulted"
  }
}

Step 5: The Admin Cancellation Trigger
If a client fails to show up, the business owner needs a button in /admin/bookings to charge the penalty fee.


┌────────────────────────────────────────────────────────┐
│                   No-Show Action Flow                  │
└───────────────────────────┬────────────────────────────┘
                            │
              Admin clicks "Mark No-Show & Charge"
                            │
                            ▼
          ┌───────────────────────────────────┐
          │ Azure Function: /api/charge-noshow│
          └─────────────────┬─────────────────┘
                            │
                            ▼
     ┌──────────────────────────────────────────────┐
     │  Stripe API: Create Payment Intent           │
     │  - Uses: `paymentMethodId`                   │
     │  - Off-session: true                         │
     │  - Destination: tenant's `stripe_account_id` │
     └──────────────────────┬───────────────────────┘
                            │
               ┌────────────┴────────────┐
               ▼                         ▼
         [Success]                  [Failed/Declined]
               │                         │
     Update Cosmos DB status:   Update Cosmos DB status:
     "cancelled_and_charged"    "cancelled_charge_failed"



The Endpoint: Create a protected Azure Function route: POST /api/charge-noshow.

Execute Charge: The function reads the client's configuration for the cancellationFeeAmount and triggers an off-session PaymentIntent via Stripe:



const paymentIntent = await stripe.paymentIntents.create({
  amount: tenant.cancellationFeeAmount * 100, // In cents
  currency: tenant.currency,
  payment_method: reservation.guarantee.paymentMethodId,
  customer: reservation.guarantee.customerId,
  off_session: true,
  confirm: true,
}, {
  stripeAccount: tenant.stripeUserId
});


3. **Handle Edge Cases:** If the charge fails (e.g., insufficient funds), catch the error, update the Cosmos DB record to `charge_failed`, and alert the barber on the UI so they can handle it manually or ban the client from future bookings.

---

## Local Dev Simulation (Keeping it Agent-Friendly)
Since your project conventions dictate a robust local development mode without cloud dependencies, update your local data file simulation.

In `data/reservations-local.json`, mock the payment response:
* When running locally (`NEXT_PUBLIC_ADMIN_API_URL` is unset), bypass the Stripe Elements mounting step in your React component and instead inject a fake string `"pm_mock_local_12345"` into the booking submission payload. 
* This keeps your local development pipeline fast, entirely offline, and fully testable for your future AI agents.