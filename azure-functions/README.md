# Reservation API — Azure Function App

Node.js/TypeScript Azure Functions v4 that power the calendar-based reservation feature for all web-builder clients.

## Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/reservations` | Create a reservation |
| GET | `/api/availability?clientId=&date=YYYY-MM-DD` | Return booked time slots for a date |

## Environment variables

Set these in Azure Portal → Function App → Configuration, or in `local.settings.json` for local dev.

| Variable | Required | Description |
|----------|----------|-------------|
| `COSMOS_ENDPOINT` | Yes | Azure Cosmos DB account endpoint URL |
| `COSMOS_KEY` | Yes | Cosmos DB primary key |
| `COSMOS_DATABASE` | No | Database name (default: `reservations`) |
| `COSMOS_CONTAINER` | No | Container name (default: `bookings`) |
| `NOTIFICATION_EMAIL_FROM` | No | Sender address for confirmation emails |
| `SENDGRID_API_KEY` | No | SendGrid API key — emails are skipped if absent |

## Cosmos DB setup

Create a database named `reservations` with a container named `bookings`, partition key `/clientId`.

## Local development

```bash
cd azure-functions
npm install
npm run build
npm start   # requires Azure Functions Core Tools v4
```

## Connecting a client

In `config/clients/{clientId}/client.json`:

```json
{
  "features": { "booking": true },
  "reservationEndpoint": "https://<function-app>.azurewebsites.net/api/reservations"
}
```

Then add a page using the `reservationBlock` type (or inherit from `restaurant-standard` template which includes `/reservas`).
