# Local Setup

## Backend

```bash
npm install
npm start
```

Configure Razorpay credentials in the backend environment before starting the server.

## Frontend

Run the frontend through a local development server and confirm its API endpoint points to the running backend.

## Test Checklist

- Backend starts without configuration errors.
- Create-order request succeeds.
- Razorpay checkout opens.
- Successful payments reach verification.
- Failed or cancelled payments are handled gracefully.
