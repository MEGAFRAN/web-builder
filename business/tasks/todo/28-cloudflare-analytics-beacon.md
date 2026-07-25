# Task: Cloudflare Web Analytics Beacon (T-F)

**Status:** Ready for development
**Priority:** Medium — required for monthly retention stats
**Owner:** nextjs-frontend-developer
**Estimated scope:** Small — 30 min
**Depends on:** None (can run in parallel with T-A, T-B, T-C)
**Milestone:** M0 (Week 1)
**Source:** `docs/meetings/summaries/2026-07-24-pivot-mobile-repair-shops-spain.md`

---

## Context

The only product touchpoint with a paying client after their site goes live is a monthly stats message: *"Tu web tuvo 214 visitas este mes y 23 personas pulsaron el botón de WhatsApp."* Without site analytics, there is no number to send, and the client sees zero evidence of value — which is the primary churn driver for a brochure site with no engagement loop.

**Why Cloudflare Web Analytics specifically:**
- **Cookieless by design** — no consent banner required under GDPR/LSSI-CE. Google Analytics would force a cookie consent modal onto every repair shop site, which is a conversion tax and an AEPD exposure the founder cannot afford to debug.
- Free tier. No account-level cost.
- Accessible via Cloudflare GraphQL API for future automation (Task T-G+, deferred to ~5 paying clients).

The beacon is a single `<script defer>` tag. This is the entire implementation.

---

## Technical Specifications

### Analytics token per client

Add an optional `analyticsToken` field to `config/schemas/client.schema.json`:

```json
"analyticsToken": {
  "type": "string",
  "description": "Cloudflare Web Analytics site token for this client."
}
```

This field is optional. When absent, no beacon is injected (demos share the owner's token).

### Beacon injection in `app/layout.tsx`

Read `analyticsToken` from the client config at build time (it is already available via `getClientConfig()` or equivalent). If present, inject:

```tsx
{clientConfig.analyticsToken && (
  <Script
    defer
    src="https://static.cloudflareinsights.com/beacon.min.js"
    data-cf-beacon={`{"token": "${clientConfig.analyticsToken}"}`}
    strategy="afterInteractive"
  />
)}
```

Use Next.js `<Script>` with `strategy="afterInteractive"` — not a raw `<script>` tag — so it does not block page render.

### Demo token strategy

- Demos share a single Cloudflare Web Analytics token on the **vanity demo domain** (`demo.clubtal.com` — not the raw `.web.core.windows.net` URL). Configure via `CF_ANALYTICS_TOKEN_DEMO` when `CLIENT_ID` starts with `demo-`.
Paying clients each get their own Cloudflare Web Analytics site on their **custom domain** (separate from the shared demo vanity domain). Token stored in `config/clients/{clientId}/client.json` under `analyticsToken`.
- Do not hard-code any token value in `app/layout.tsx`. Read from config or env only.

### WhatsApp click tracking

`tel:` links do NOT fire a page load — Cloudflare Web Analytics cannot track phone call taps. WhatsApp clicks ARE trackable if routed through a static redirect page.

Create a static redirect page at `app/(site)/whatsapp/page.tsx`:

```tsx
import { redirect } from 'next/navigation';
import { getClientConfig } from '@/lib/client-config';

export default function WhatsAppRedirect() {
  const { whatsapp } = getClientConfig();
  redirect(`https://wa.me/${whatsapp}`);
}
```

Update all WhatsApp CTAs in the template from `https://wa.me/{{whatsapp}}` to `/whatsapp` (an internal Next.js route). This generates a real page view in Cloudflare Analytics whenever someone taps the WhatsApp button.

**Do NOT apply this pattern to `tel:` links.** Redirect delay on phone calls costs real conversions.

---

## Requirements

- [ ] Add optional `analyticsToken` field to `config/schemas/client.schema.json`.
- [ ] Inject Cloudflare Web Analytics beacon in `app/layout.tsx` using Next.js `<Script>` when `analyticsToken` is set.
- [ ] Support demo token via `CF_ANALYTICS_TOKEN_DEMO` env var (applied when `CLIENT_ID` starts with `demo-`).
- [ ] Create `app/(site)/whatsapp/page.tsx` that redirects to `https://wa.me/{whatsapp}` from client config.
- [ ] Update all WhatsApp CTAs in the repair-shop template from `https://wa.me/{{whatsapp}}` to `/whatsapp` (internal route).
- [ ] `tel:` links remain unchanged — no redirect, direct dial.
- [ ] No hard-coded token values in source code.

---

## Files touched

| Area | Paths |
|---|---|
| Client schema | `config/schemas/client.schema.json` (modified — additive only) |
| App layout | `app/layout.tsx` (modified) |
| New page | `app/(site)/whatsapp/page.tsx` (new) |
| Template | `config/templates/cell-phone-repair-shop/pages/index.json` (modified — WhatsApp href to `/whatsapp`) |
| Template | `config/templates/cell-phone-repair-shop/pages/servicios.json` (modified — same) |

---

## Out of scope

- Google Analytics or any other analytics provider.
- Cookie consent banners.
- Automated monthly stats reporting (deferred to ~5 paying clients).
- Cloudflare API integration.

---

## Acceptance criteria

1. A build with `CF_ANALYTICS_TOKEN_DEMO=test-token CLIENT_ID=demo-phone-repair-shop npm run build:blob` produces HTML containing the Cloudflare beacon script tag with the correct token.
2. The `/whatsapp` route redirects to `https://wa.me/{phone}` where `{phone}` is the client's configured number.
3. `tel:` links in the output HTML are unchanged (`tel:+34...`), not routed through any redirect.
4. A client config without `analyticsToken` produces a build with no beacon script tag.
5. No hard-coded token values appear in any source file.
