# MovieBook + Razorpay Online Payment

This is an upgraded BookMyShow-style educational application.

## Flow

1. Select movie.
2. Select theatre.
3. Select showtime.
4. Select seats.
5. Click "Proceed to Online Payment".
6. Server creates a Razorpay order.
7. Razorpay Checkout opens.
8. Complete payment in Razorpay Test Mode.
9. Server verifies the Razorpay signature.
10. Only after verification is the booking confirmed.
11. A confirmation window opens and closes automatically after 5 seconds.

## Recommended movies

The application now includes clickable recommended movie cards:
- RRR
- Kalki 2898 AD
- Pushpa 2
- Interstellar
- Baahubali 2
- KGF Chapter 2

Clicking a recommended movie automatically selects it in the movie dropdown and updates the ticket price.

## Technologies

- HTML5
- CSS3
- JavaScript
- DOM
- Node.js
- Express.js
- Razorpay Checkout
- Razorpay Orders API
- HMAC-SHA256 payment signature verification

## Setup

### 1. Install Node.js

Install Node.js on your computer.

### 2. Open this project in VS Code

Open the `MovieBook_Razorpay` folder.

### 3. Install dependencies

Run:

npm install

### 4. Create Razorpay Test Mode keys

Create/sign in to your Razorpay account and use Test Mode while developing.

Get:
- Key ID
- Key Secret

Never put the Key Secret inside `script.js` or any browser-side JavaScript.

### 5. Create `.env`

Copy `.env.example` to `.env` and replace the values:

RAZORPAY_KEY_ID=your_test_key_id
RAZORPAY_KEY_SECRET=your_test_key_secret
PORT=3000

### 6. Start the application

Run:

npm start

Then open:

http://localhost:3000

## Payment methods

Razorpay Checkout can present supported online payment methods such as UPI, cards and net banking depending on account/configuration.

## Important security note

Do NOT use a fake client-side "payment successful" flag in a real application.

The application sends the payment result to the server and verifies the Razorpay signature before confirming the movie booking.

For a production app, also:
- Save bookings in MySQL/MongoDB.
- Lock seats while payment is in progress.
- Confirm the payment/capture status according to the gateway's current integration requirements.
- Use webhooks for reliable payment-event processing.
- Keep API secrets in environment variables.
- Add authentication and authorization.
- Validate all input on the server.

## Window closing

Browsers normally prevent JavaScript from closing a normal tab opened manually by the user.

This project opens the confirmation window using `window.open()`. Because that window is script-opened, it can call `window.close()` after the booking is confirmed.
