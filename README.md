# Mangal Prime

A modern, responsive site for Mangal Prime (Mangal theme) with contact form and Node.js backend.

## Features

- Mangal theme (Home, Menu, About, Contact)
- Contact form with email integration (Nodemailer)
- Node.js + Express with route modules

## How to start

### 1. Install dependencies

```bash
npm install
```

### 2. (Optional) Set port and env

To change the port or SMTP settings:

- Copy `env.example.txt` to `.env`
- Edit `.env`, for example:

```env
PORT=3000
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

If you don’t create `.env`, the app uses **port 3000** by default.

### 3. Run the server

**Production:**

```bash
npm start
```

**Development (auto-restart on file changes):**

```bash
npm run dev
```

### 4. Open in browser

- **http://localhost:3000** (or the port in your `.env`)

Pages: `/` (home), `/menu`, `/about`, `/contact`.

## SMTP Configuration

For Gmail:
1. Enable 2-Step Verification
2. Generate an App Password: https://myaccount.google.com/apppasswords
3. Use the app password in `SMTP_PASS`

For other SMTP providers, update `SMTP_HOST` and `SMTP_PORT` accordingly.

## Project Structure

```
mangal-prime/
├── server.js           # Express app entry
├── routes/             # Page routes
│   ├── index.js        # GET /
│   ├── menu.js         # GET /menu
│   ├── about.js        # GET /about
│   └── contact.js      # GET /contact, POST /api/contact
├── views/              # HTML pages (Mangal theme)
│   ├── index.html
│   ├── menu.html
│   ├── about.html
│   └── contact.html
├── public/             # Static files
│   ├── assets/         # Theme CSS, JS, images
│   └── ...
└── .env                # Optional (copy from env.example.txt)
```

## Contact Form

The contact form sends emails to: `info@mangalprime.com`

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


