# Payment Gateway

A full-stack Razorpay payment integration demonstrating order creation, checkout, and payment verification.

## Architecture

- Frontend: HTML, CSS, JavaScript
- Backend: Node.js and Express
- Payments: Razorpay Checkout and API
- Deployment: frontend and backend can be deployed separately

## Payment Flow

1. User selects a product.
2. Frontend requests an order from the backend.
3. Backend creates a Razorpay order.
4. Razorpay Checkout opens in the browser.
5. Payment details are verified by the backend.
6. The frontend displays the payment result.

## Security

Never commit Razorpay keys or other secrets. Configure credentials through environment variables on the backend.

## Status

Payment flow is implemented for learning and demonstration purposes. Production use should add robust validation, logging, error handling, and webhook-based reconciliation.
