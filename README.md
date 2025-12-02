# WiFi Billing System (Starter)

This repository is a **starter WiFi billing system** you can host on GitHub and run on a server.
It provides:

- User login (simple username)
- Package selection (1hr, 2hr, 5hr)
- M-Pesa STK Push initiation (Daraja) to phone
- Generates access codes that expire after the purchased time
- `/api/validate` endpoint for your router to check codes
- Basic mpesa callback endpoint to receive payment confirmations

> **Important:** This is a starter/demo. For production use you must secure endpoints, validate payments via callback, use a real DB, and secure your Mpesa credentials.

## Quick start (locally)

1. Clone repo:
   ```bash
   git clone <this-repo>
   cd wifi-billing-system/backend
   ```

2. Copy `.env.template` to `.env` and fill values (MPESA keys, PASSKEY, CALLBACK URL). Use sandbox keys for testing.

3. Install dependencies:
   ```bash
   npm install
   ```

4. Start the server:
   ```bash
   npm start
   ```

5. Open `http://localhost:3000` in your browser. The backend serves the frontend static files.

## How it works

- Frontend calls `/api/pay` which triggers an STK push (M-Pesa).
- The server generates a 6-char access code and stores it with an expiry in `backend/db.json`.
- Your router can call `/api/validate` with `{ "code": "ABC123" }` to check if the code is valid.
- There's a `/mpesa/callback` endpoint to receive payment notifications — in production you should use this to mark sessions active only after successful payment.

## Notes about phone number

- M-Pesa STK Push expects `PhoneNumber` and `PartyA` in the international format `2547XXXXXXXX`.
- The frontend will convert numbers that start with `0` to `254...` for convenience.
- Default phone number in `.env.template` is set as `254753925088` (your provided local number `0753925088`).

## Next steps / suggestions

- Use a real database (Postgres/MongoDB).
- Secure endpoints (authentication, rate limits).
- Verify payments in `mpesa/callback` before granting WiFi.
- Integrate with your hotspot/router (ChilliSpot, CoovaChilli, MikroTik, Unifi) to exchange access codes.
- Add email/SMS receipts.

