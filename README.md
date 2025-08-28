# fastcard-app

Proxy + frontend for FastCard API.

## Local test
1. انسخ `.env.example` إلى `.env` واملأ `API_TOKEN`.
2. npm install
3. npm start
4. افتح http://localhost:3000/

## Deploy (Render)
- ارفع هذا الريبو إلى GitHub.
- اربط المستودع مع Render كـ Web Service.
- في Render → Environment Variables ضف:
  - API_TOKEN = <OMx7VqKf6M1mODrEOT8WqHGp2cqodgObsRHRZx3yCB-DzOdpFIRTIgUWuHPsWRvP>
  - API_BASE = https://fastcard1.store/client/api
- Start Command: npm start
