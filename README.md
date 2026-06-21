# BulkMailer 🚀

**Made by Sanket Kokate**

BulkMailer is a powerful, full-stack internal mail-merge tool designed to send personalized mass emails to your recipients seamlessly. It features a modern, responsive React dashboard, real-time delivery tracking, and a robust Node.js backend powered by MongoDB. 

## ✨ Key Features
- **Upload CSV/Excel**: Easily import thousands of recipients at once.
- **Merge Tags**: Personalize your subjects and email bodies (e.g., `Hello {{Name}}, your invoice {{InvoiceID}} is due`).
- **Smart Throttling**: Automatically throttles sending to 1 email per second to mimic human behavior and bypass strict spam filters.
- **Live Feed Dashboard**: Watch your emails go out in real-time with visual indicators for Sent, Bounced, and Failed.
- **Custom Backend Architecture**: Powered by Express, Mongoose (MongoDB Atlas), and JWT Authentication.
- **Flexible SMTP Delivery**: Configurable to send via Gmail App Passwords or robust services like SendGrid.

---

## 🛠 Tech Stack
- **Frontend**: React.js (Vite), CSS3
- **Backend**: Node.js, Express.js
- **Database**: MongoDB Atlas (Mongoose)
- **Email Engine**: Nodemailer
- **Authentication**: Custom JWT (JSON Web Tokens)

---

## 🚀 Getting Started

### Prerequisites
Before running the project, make sure you have the following installed:
- [Node.js](https://nodejs.org/en/)
- A free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) database
- A free Google account (for Gmail SMTP) or a SendGrid account

### 1. Installation

Clone the repository and install dependencies for both the frontend and the backend.

```bash
# Install frontend dependencies
npm install

# Navigate to the server folder and install backend dependencies
cd server
npm install
```

### 2. Environment Configuration

Create a `.env` file in the `server` directory (`server/.env`) and add the following variables:

```env
# Backend Port
PORT=5000

# MongoDB Connection String (Replace with your own Cluster URL and Password)
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/bulkmailer

# Security Token (Can be any random string)
JWT_SECRET=super_secret_jwt_key_here

# Email Delivery Settings (Example using Gmail App Passwords)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_16_letter_app_password
SMTP_FROM=your_email@gmail.com
```

### 3. Running the App

You will need two terminal windows open to run the full stack.

**Terminal 1 (Backend):**
```bash
cd server
node server.js
```
*(You should see "✅ Connected to MongoDB")*

**Terminal 2 (Frontend):**
```bash
npm run dev
```

Finally, open your browser and go to `http://localhost:5173/` to log in and start sending!

---

## 💡 Troubleshooting

- **MongoDB IP Blocked**: If your Node server crashes with a `MongooseServerSelectionError`, your current Wi-Fi/IP address is not whitelisted. Go to your MongoDB Atlas dashboard -> Network Access -> Add `0.0.0.0/0`.
- **Failed to Send Email**: If your dashboard says "Failed to send", ensure your `SMTP_PASS` is correct in `server/.env`. If you are using Gmail, make sure you are using an **App Password** (from Google Security Settings), not your actual Google account password.

---

*Designed and engineered by Sanket Kokate.*
