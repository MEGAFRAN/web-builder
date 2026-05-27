Opting for the No-Show Guarantee (Card-on-File) is a highly strategic move. It is exactly why service providers love Booksy: it protects their time without adding friction to the booking process for their customers.

From an architectural standpoint, you will be using Stripe Connect combined with Stripe Setup Intents. This allows your platform to securely collect card details on behalf of your tenants, saving a reusable token (payment_method_id) in your Cosmos DB for the business owner to charge later if a client ghosts them.

Here is the exact step-by-step implementation map for your serverless Next.js/Azure architecture.

Step 1: Update the Tenant Configuration Schema
You need to know whether a specific tenant enforces the guarantee and what their cancellation fee is. Add these fields to your JSON schema (e.g., config/schemas/client.schema.json):


"bookingSettings": {
  "type": "object",
  "properties": {
    "enforceGuarantee": { "type": "boolean" },
    "cancellationFeeAmount": { "type": "number" },
    "currency": { "type": "string", "enum": ["USD", "EUR", "GBP"] }
  },
  "required": ["enforceGuarantee"]
}


Step 2: Tenant Onboarding (Admin Portal)
Before a tenant can collect card details, they must link their own Stripe account so they can receive funds if they enforce a cancellation charge.

Stripe Connect Setup: In your Stripe Dashboard, enable Stripe Connect and choose Standard accounts (easiest to manage, zero liability for you).

The Connection Link: In app/admin/settings/page.tsx, add a "Connect with Stripe" button. This will execute the following:


import Stripe from "stripe"
const stripe = new Stripe(STRIPE_SECRET_KEY)

let accountId;

if (cosmoDB.user.stripe_account_id) {
  console.log("user already has account:", user.stripe_account_id)
  accountId = user.stripe_account_id;

//verify if the account still exists
  try {
    const existingAccount = await stripe.accounts.retrieve(accountId);
    console.log("Existing account verified")
    return NextResponse.json({
      accountId,
      status: "existing",
      capabilities: existingAccount.capabilities,
    })
  } catch (error) {
    console.log("account not found, creating new one");
    accountId = undefined;
    cosmoDB.user.stripe_account_id = undefined;
  }
}

if (!accountId) {
  const account = await stripe.accounts.create({
    country: country (The country in which the account holder resides, or in which the business is legally established. This should be an ISO 3166-1 alpha-2 country code. For example, if you are in the United States and the business for which you’re creating an account is legally represented in Canada, you would use CA),
    email: cosmoDB.user.email,
    business_type: "individual",
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
    controller: {
      fees: {
        payer: 'account',
      },
      losses: {
        payments: 'stripe',
      },
    stripe_dashboard: {
      type: 'express',
    },
      metadata: {
        onboarding_type: "deferred",
        platform_user_id: clientId

      },
    },
  });
}


Save the "accountId", Your Azure Function exchanges this code for a stripe_account_id (the tenant's account ID) and saves it directly to that client's record in Cosmos DB ( in the database stripe_account_id = accountId)
