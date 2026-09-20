# Payment Gateway

A full-stack Razorpay payment integration for a digital resume-template storefront.

## Architecture

- Frontend: HTML, CSS, JavaScript
- Backend: Node.js, Express, Razorpay
- Payments: Razorpay Checkout + server-side verification
- Frontend deployment: Vercel or any static host
- Backend deployment: Render

The frontend and backend are maintained in separate repositories:

- Frontend: https://github.com/Prashant-112-coder/payment-gateway
- Backend: https://github.com/Prashant-112-coder/razorpay_backend

## Payment flow

1. Customer selects the resume pack.
2. Frontend sends only the product ID to the backend.
3. Backend determines the trusted product price and creates the Razorpay order.
4. Razorpay Checkout opens in the browser.
5. Backend verifies the checkout signature.
6. Backend fetches the Razorpay order and payment and validates their status, amount, currency, and relationship.
7. Frontend displays the verified payment result.

## Security

- Razorpay secret credentials stay server-side.
- Product pricing is owned by the backend rather than the browser.
- Payment signatures are verified on the backend.
- Payment status, order ID, amount, and currency are validated with Razorpay before success is shown.
- CORS is restricted to the configured frontend origin.
- Never commit .env files or secrets.

## Local development

Run the backend from the separate razorpay_backend repository, configure its environment variables, and serve this repository as a static frontend.

The frontend currently points to the deployed Render backend in script.js.

## Current scope

This is a learning/portfolio payment integration. Production use should additionally add persistent orders, authenticated customer accounts, webhook-based reconciliation, refunds, rate limiting, and protected digital-product delivery.
