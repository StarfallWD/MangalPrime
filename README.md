# Mangal Prime Landing Page

A modern, responsive landing page for Mangal Prime with contact form functionality.

## Features

- Responsive design (mobile-friendly)
- Contact form with email integration
- Social media links (Instagram, Facebook)
- Node.js backend with Express
- SMTP email sending via Nodemailer

## Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
   - Copy `env.example.txt` to `.env`
   - Update SMTP settings in `.env`:
     ```
     SMTP_HOST=smtp.gmail.com
     SMTP_PORT=587
     SMTP_USER=your-email@gmail.com
     SMTP_PASS=your-app-password
     PORT=3000
     ```

## Running the Application

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The server will run on `http://localhost:3000` (or the port specified in `.env`).

## SMTP Configuration

For Gmail:
1. Enable 2-Step Verification
2. Generate an App Password: https://myaccount.google.com/apppasswords
3. Use the app password in `SMTP_PASS`

For other SMTP providers, update `SMTP_HOST` and `SMTP_PORT` accordingly.

## Project Structure

```
MangalPrimeLanding/
├── server.js          # Express server
├── package.json        # Dependencies
├── public/            # Frontend files
│   ├── index.html     # Main HTML
│   ├── styles.css     # Styles
│   └── script.js      # Client-side JavaScript
├── assets/            # Static assets (logo, images)
│   └── logo.jpg
└── .env              # Environment variables (create from env.example.txt)
```

## Contact Form

The contact form sends emails to: `info@mangalcanada.com`

Required fields:
- First Name
- Last Name
- Email
- Message

Optional fields:
- Phone

## Deployment

For Contabo server deployment:
1. Upload all files to your server
2. Install Node.js and npm
3. Run `npm install`
4. Configure `.env` file
5. Use PM2 or similar process manager:
   ```bash
   pm2 start server.js --name mangal-prime
   ```
6. Configure reverse proxy (nginx) if needed

## Domain

Configured for: `mangalprime.com`


