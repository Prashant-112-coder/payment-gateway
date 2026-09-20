# Payment Security Notes

## Secrets

Keep Razorpay API credentials in server-side environment variables. Never expose secret keys in frontend JavaScript or commit them to Git.

## Verification

Payment verification must happen on the trusted backend using the expected signature verification mechanism.

## Production Hardening

- Validate request bodies.
- Use HTTPS.
- Rate-limit sensitive endpoints.
- Log failures without logging secrets.
- Use Razorpay webhooks for reliable payment reconciliation.
