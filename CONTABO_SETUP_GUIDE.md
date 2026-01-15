# Contabo Server Setup Guide for Mangal Prime Landing Page

This guide will walk you through setting up the Mangal Prime landing page on your Contabo server.

## Prerequisites
- Access to your Contabo server via SSH
- Root or sudo access
- Domain name: mangalprime.com (configured to point to your server IP)

---

## Step 1: Initial Server Access and Verification

```bash
# Connect to your server
ssh root@your-server-ip
# OR if you have a specific user:
# ssh your-user@your-server-ip

# Verify server is accessible (no system upgrades needed since server is already running)
```

---

## Step 2: Create Application User (Non-Admin)

```bash
# As root or admin user, create a new user for the application
sudo adduser mangalprime

# DO NOT add to sudo group - this user will only have access to the project directory
# Skip this line: sudo usermod -aG sudo mangalprime

# Switch to the new user
su - mangalprime
```

**Important**: This user will NOT have admin privileges. System-level tasks (Nginx, SSL, firewall) will need to be done as root/admin user.

---

## Step 3: Verify Firewall Configuration and Add Port

```bash
# IMPORTANT: This step must be done as ROOT/ADMIN user
# Check current firewall status
sudo ufw status

# Check which ports are already in use (to avoid conflicts)
# Common ports: 3000, 3001, 3002, etc.

# IMPORTANT: Each new project needs its own port
# Add a new port for this project (choose an available port, e.g., 3002, 3003, etc.)
# Replace PORT_NUMBER with your chosen port (e.g., 3002)
sudo ufw allow PORT_NUMBER/tcp

# If firewall is not enabled or basic ports are missing, add them:
# sudo ufw allow 22/tcp   # SSH (if not already allowed)
# sudo ufw allow 80/tcp    # HTTP (if not already allowed)
# sudo ufw allow 443/tcp   # HTTPS (if not already allowed)

# Only enable if not already enabled:
# sudo ufw enable

# Example: If you choose port 3002:
# sudo ufw allow 3002/tcp
```

---

## Step 4: Verify Node.js and PM2 Installation

```bash
# Check if Node.js is already installed
# Note: This can be checked as any user, but installation requires root/admin
node --version
npm --version

# If Node.js is NOT installed, install it as ROOT/ADMIN user:
# curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
# sudo apt install -y nodejs

# Check if PM2 is already installed
pm2 --version

# If PM2 is NOT installed, install it globally as ROOT/ADMIN user:
# sudo npm install -g pm2

# Note: After global installation, mangalprime user will be able to use Node.js and PM2
```

---

## Step 5: Create Virtual Server in Virtualmin

**IMPORTANT:** Since your server uses Virtualmin for domain management, you must create the site through Virtualmin web interface.

### Access Virtualmin

1. **Login to Virtualmin:**
   - URL: `https://your-server-ip:10000`
   - Or: `https://your-domain:10000`
   - Login with root/admin credentials

### Create Virtual Server

1. **Click "Create Virtual Server"** in the left menu
2. **Fill in the details:**
   - **Server Type:** Select "Top-level Server"
   - **Domain name:** `mangalprime.com`
   - **Administration password:** Leave default or set one
   - **Email for domain administrator:** Your email
   - **MySQL database:** Uncheck (we're using Node.js, not MySQL)
   - **DNS domain:** Check `Create DNS records`
   - **Website:** Check `Enable Website`
   - **SSL:** Leave unchecked for now (we'll add SSL later)

3. **Click "Create Server"**

### Configure as Reverse Proxy

After creating the server:

1. **Go to:** `mangalprime.com` → **Services** → **Website Proxy Settings**
2. **Configure Proxy:**
   - **Proxying enabled:** Select "Yes"
   - **Proxy to URL:** Enter `http://localhost:PORT_NUMBER` (replace PORT_NUMBER with your port, e.g., 3002)
   - **IMPORTANT:** Do NOT add a trailing slash (`/`) at the end of the URL
   - Click **"Save and Apply"**

3. **Alternative Method - URL Path Locations:**
   - If "Website Proxy Settings" is not available, go to: `mangalprime.com` → **Services** → **Apache Website** (or **Nginx Website**)
   - Click **"Edit Virtual Host"**
   - Go to **"URL Path Locations"** tab
   - Find the `/` path entry (or add it if it doesn't exist)
   - Set **Match type:** "Sub-directory"
   - Set **Corresponding directory:** "Proxy to http://localhost:PORT_NUMBER" (replace PORT_NUMBER with your port)
   - Click **"Save"**

### CRITICAL: Restart Nginx After Virtualmin Configuration

**IMPORTANT:** After making any changes in Virtualmin (creating virtual server or configuring proxy), you MUST restart Nginx completely. Virtualmin's reload may not work properly, especially with IPv6 bind issues.

```bash
# IMPORTANT: This step must be done as ROOT/ADMIN user
# Stop Nginx completely
sudo systemctl stop nginx

# Verify Nginx is stopped
sudo systemctl status nginx

# Start Nginx
sudo systemctl start nginx

# Verify Nginx is running
sudo systemctl status nginx

# Test the site
curl http://mangalprime.com | head -20
```

**Why restart instead of reload?**
- Virtualmin's `systemctl reload nginx` may fail with IPv6 bind errors
- A full restart ensures all configurations are properly loaded
- This is especially important after creating a new virtual server or changing proxy settings

**Important Notes:**
- Virtualmin manages the domain configuration automatically
- **ALWAYS restart Nginx** (stop + start) after Virtualmin changes, don't just reload
- Keep PORT_NUMBER consistent: firewall (Step 3), Virtualmin proxy, and .env file (Step 10)
- If you see "bind() failed (98: Address already in use)" errors, use `systemctl stop nginx` then `systemctl start nginx`

---

## Step 6: Configure Domain DNS (Required Before SSL)

**IMPORTANT:** You must configure DNS before SSL certificate installation. Let's Encrypt needs to verify domain ownership through DNS records.

**Note:** If you created the virtual server in Virtualmin with "Create DNS records" checked, Virtualmin may have created DNS templates, but you still need to configure actual DNS at your domain registrar (GoDaddy).

### Get Your Server IP Address

```bash
# Get your server's public IP address
curl ifconfig.me
# OR
hostname -I
```

Copy this IP address - you'll need it for DNS configuration.

### Configure DNS in GoDaddy

1. **Login to GoDaddy** and go to **Domain Manager**
2. Select your domain: `mangalprime.com`
3. Click on **DNS** or **DNS Management**
4. Add/Edit the following DNS records:

#### Option A: Using A Records (Recommended)

**A Record for root domain:**
- **Type:** `A`
- **Name:** `@` (or leave blank/empty)
- **Value:** Your server IP address (from the command above)
- **TTL:** `600` (or default)

**A Record for www subdomain:**
- **Type:** `A`
- **Name:** `www`
- **Value:** Your server IP address (same IP as above)
- **TTL:** `600`

#### Option B: Using CNAME (Alternative)

**A Record for root domain:**
- **Type:** `A`
- **Name:** `@` (or leave blank)
- **Value:** Your server IP address
- **TTL:** `600`

**CNAME Record for www:**
- **Type:** `CNAME`
- **Name:** `www`
- **Value:** `mangalprime.com`
- **TTL:** `600`

### Verify DNS Propagation

After saving DNS records, wait 5-30 minutes for DNS propagation, then verify:

```bash
# Check if DNS is resolving correctly
nslookup mangalprime.com
nslookup www.mangalprime.com

# Both should return your server IP address
```

**Important:** Do NOT proceed to SSL installation until DNS is properly configured and resolving to your server IP.

---

## Step 7: Setup SSL Certificate (Let's Encrypt)

**You can set up SSL either through Virtualmin UI or via command line:**

### Option A: Using Virtualmin UI (Recommended)

1. **Go to:** Virtualmin → `mangalprime.com` → **Services** → **SSL Certificate**
2. **Click "Let's Encrypt"** tab
3. **Select domains:** `mangalprime.com` and `www.mangalprime.com`
4. **Click "Obtain Certificate"**
5. **Virtualmin will:**
   - Automatically configure Nginx
   - Set up SSL certificates
   - Configure HTTP to HTTPS redirect (if you choose)

6. **CRITICAL: Restart Nginx after SSL installation:**
```bash
# IMPORTANT: This step must be done as ROOT/ADMIN user
sudo systemctl stop nginx
sudo systemctl start nginx
sudo systemctl status nginx

# Test HTTPS
curl https://mangalprime.com | head -20
```

### Option B: Using Command Line

```bash
# IMPORTANT: This step must be done as ROOT/ADMIN user
# Check if Certbot is already installed
certbot --version

# If Certbot is NOT installed:
# sudo apt install -y certbot python3-certbot-nginx

# Before running certbot, ensure:
# 1. DNS records are configured (Step 6) and DNS is resolving correctly
# 2. Virtual server is created in Virtualmin (Step 5)
# 3. Domain is pointing to your server IP

# Then obtain SSL certificate for mangalprime.com
sudo certbot --nginx -d mangalprime.com -d www.mangalprime.com

# Follow the interactive prompts:
# - Enter email address
# - Agree to terms
# - Choose whether to redirect HTTP to HTTPS (recommended: Yes)

# Certbot will automatically update your Nginx configuration

# Verify automatic renewal is set up (should already be configured if certbot was used before)
sudo certbot renew --dry-run
```

**Note:** 
- Virtualmin manages SSL certificates through its UI, so Option A is recommended
- If you use command line (Option B), Virtualmin may override changes during its next configuration update
- Virtualmin's SSL management integrates better with domain management

---

## Step 8: Setup Git and Clone Repository

```bash
# Switch to mangalprime user for application work
su - mangalprime

# Check if Git is already installed
git --version

# If Git is NOT installed, install it as ROOT/ADMIN user:
# exit  # (to go back to root/admin)
# sudo apt install -y git
# su - mangalprime  # (switch back to mangalprime user)

# Configure Git (only if not already configured)
git config --global user.name "Your Name"
git config --global user.email "your-email@example.com"

# Check if SSH key exists for GitHub
ls -la ~/.ssh/id_*.pub

# If SSH key exists in another user (recommended for existing servers):
# Find existing SSH keys on the server
# sudo find /home -name "id_*.pub" 2>/dev/null

# Copy SSH key from another user (e.g., from starfall user)
# Replace 'starfall' with the user who has the SSH key
# sudo cp /home/starfall/.ssh/id_ed25519 ~/.ssh/
# sudo cp /home/starfall/.ssh/id_ed25519.pub ~/.ssh/
# sudo chown mangalprime:mangalprime ~/.ssh/id_ed25519*
# chmod 600 ~/.ssh/id_ed25519
# chmod 644 ~/.ssh/id_ed25519.pub

# Test SSH connection to GitHub
ssh -T git@github.com
# Should show: "Hi [username]! You've successfully authenticated..."

# If you need to create a new SSH key for GitHub:
# ssh-keygen -t ed25519 -C "your-email@example.com"
# cat ~/.ssh/id_ed25519.pub
# Copy the output and add it to GitHub: Settings > SSH and GPG keys

# Navigate to home directory
cd ~

# Virtualmin creates public_html for each domain
# Clone the repository into public_html (Virtualmin's standard directory)
mkdir -p ~/public_html
cd ~/public_html

# Clone the repository
git clone git@github.com:StarfallWD/MangalPrime.git .

# Or using HTTPS (if SSH key not set up):
# git clone https://github.com/StarfallWD/MangalPrime.git .
```

---

## Step 9: Configure Application Permissions

```bash
# IMPORTANT: This step must be done as ROOT/ADMIN user, NOT as the application user
# Switch back to root/admin user first:
# exit  # (if you're logged in as mangalprime user)

# Virtualmin automatically sets up permissions, but verify them
# The directory should be at /home/mangalprime/public_html
# Set ownership to the application user (mangalprime)
sudo chown -R mangalprime:mangalprime /home/mangalprime/public_html

# Set directory permissions
sudo chmod 755 /home/mangalprime/public_html
sudo chmod -R 755 /home/mangalprime/public_html/public
sudo chmod -R 755 /home/mangalprime/public_html/assets

# Note: Virtualmin may have already set these permissions when creating the virtual server
# Verify with: ls -la /home/mangalprime/

# Now switch back to application user for next steps
su - mangalprime
cd ~/public_html
```

---

## Step 10: Install Dependencies and Setup Environment

```bash
# Navigate to project directory
cd ~/public_html

# Install Node.js dependencies
npm install --production

# Create .env file
cp env.example.txt .env
nano .env
```

**Configure .env file with your SMTP settings:**

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
PORT=PORT_NUMBER
```

**Port Configuration:**
- Replace `PORT_NUMBER` with the port you added to firewall in Step 3 (e.g., 3002)
- This port must match:
  - The port you opened in firewall (Step 3)
  - The port in Nginx config (Step 5)
  - The port in PM2 command (Step 11)

**For Gmail SMTP:**
- Use an App Password (not your regular password)
- Go to: Google Account > Security > 2-Step Verification > App passwords
- Generate an app password for "Mail"

**For other SMTP providers (e.g., Contabo's mail server):**
```env
SMTP_HOST=mail.contabo.com
SMTP_PORT=587
SMTP_USER=info@mangalprime.com
SMTP_PASS=your-email-password
PORT=PORT_NUMBER
```

```bash
# Secure the .env file
chmod 600 .env
```

---

## Step 11: Setup PM2 Process Manager

```bash
# Navigate to project directory (as mangalprime user)
cd ~/public_html

# IMPORTANT: PM2 Port Configuration
# PM2 will use the PORT from your .env file automatically
# However, if you want to explicitly specify the port, you can use:
# pm2 start server.js --name mangalprime --update-env

# Or set the port via environment variable:
# PORT=PORT_NUMBER pm2 start server.js --name mangalprime

# Standard way (PM2 reads PORT from .env automatically):
pm2 start server.js --name mangalprime

# Verify the port is correct
pm2 show mangalprime
# Check the "env" section to see PORT=PORT_NUMBER

# Save PM2 configuration
pm2 save

# Check PM2 status
pm2 status

# View logs
pm2 logs mangalprime

# For PM2 startup on system boot (requires root/admin):
# Exit mangalprime user: exit
# As root/admin user, run:
# pm2 startup
# Then run the command that PM2 outputs (it will be a sudo command)
# This will allow PM2 to start apps automatically on server reboot
# IMPORTANT: Make sure PM2 is running as the correct user (mangalprime)
# The startup command should be run as: sudo -u mangalprime pm2 startup

# Switch back to mangalprime user: su - mangalprime

# Useful PM2 commands:
# pm2 restart mangalprime    # Restart app
# pm2 stop mangalprime        # Stop app
# pm2 delete mangalprime      # Delete app from PM2
# pm2 logs mangalprime        # View logs
# pm2 show mangalprime        # Show detailed info including port
```

**PM2 Port Explanation:**
- PM2 does NOT need a port parameter in the command. Your Node.js app (server.js) reads PORT from `.env` file automatically via `dotenv` package.
- When you run `pm2 start server.js`, PM2 starts the process and your app reads the PORT from `.env`.
- The port you configured in Step 3 (firewall), Step 5 (Nginx), and Step 10 (.env) must all match.
- You can verify the port is correct by running `pm2 show mangalprime` and checking the "env" section, or check logs with `pm2 logs mangalprime` to see "Server is running on port PORT_NUMBER".
- If you need to change the port later, update `.env` file and restart PM2: `pm2 restart mangalprime`.

---

## Step 12: Configure Nginx for Production (Final)

**Note:** If you're using Virtualmin, SSL setup through Virtualmin UI (Step 7, Option A) will automatically configure Nginx. The configuration below is for reference if you're managing Nginx manually.

After SSL is set up, your final Nginx config should look like:

**IMPORTANT: Replace `PORT_NUMBER` with the port you chose (e.g., 3002)**

**Virtualmin Users:** Virtualmin manages this automatically. If you need to manually edit, Virtualmin's config is typically at `/etc/nginx/sites-available/mangalprime.com`

```nginx
server {
    listen 80;
    server_name mangalprime.com www.mangalprime.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name mangalprime.com www.mangalprime.com;

    ssl_certificate /etc/letsencrypt/live/mangalprime.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/mangalprime.com/privkey.pem;

    # SSL configuration (Let's Encrypt adds these automatically)
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    location / {
        proxy_pass http://localhost:PORT_NUMBER;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location /assets/ {
        proxy_pass http://localhost:PORT_NUMBER;
        proxy_set_header Host $host;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

---

## Step 13: Verify Everything Works

```bash
# Check Node.js app is running
pm2 status

# Check Nginx is running
sudo systemctl status nginx

# Check firewall
sudo ufw status

# Test the application locally (replace PORT_NUMBER with your port)
curl http://localhost:PORT_NUMBER

# View application logs
pm2 logs mangalprime

# View Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

---

## Step 14: Deployment Updates (For Future Changes)

When you make changes to the code:

```bash
# Navigate to project directory
cd ~/public_html

# Pull latest changes from GitHub
git pull origin main

# Install any new dependencies
npm install --production

# Restart the application
pm2 restart mangalprime

# Check logs for any errors
pm2 logs mangalprime
```

---

## Troubleshooting

### Application not starting
```bash
# Check PM2 logs
pm2 logs mangalprime

# Check if port is in use (replace PORT_NUMBER with your port)
sudo netstat -tulpn | grep PORT_NUMBER

# Check .env file configuration
cat .env
```

### Nginx not proxying correctly
```bash
# Test Nginx configuration
sudo nginx -t

# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/virtualmin/mangalprime.com_error_log

# CRITICAL: If you see "bind() failed (98: Address already in use)" errors:
# Stop Nginx completely, then start it (don't use reload)
sudo systemctl stop nginx
sudo systemctl start nginx
sudo systemctl status nginx

# If reload doesn't work, always use stop + start
sudo systemctl stop nginx
sudo systemctl start nginx

# Verify the site is working
curl http://mangalprime.com | head -20
```

**Common Issue: Virtualmin changes not taking effect**
- After making changes in Virtualmin (proxy settings, SSL, etc.), always restart Nginx completely
- Use `systemctl stop nginx` then `systemctl start nginx` instead of `reload`
- This is especially important after creating a new virtual server or changing proxy settings

### SSL certificate issues
```bash
# Check certificate status
sudo certbot certificates

# Renew certificate manually
sudo certbot renew

# Verify certificate files exist
ls -la /etc/letsencrypt/live/mangalprime.com/
```

### Email not sending
```bash
# Check application logs for SMTP errors
pm2 logs mangalprime

# Test SMTP connection (install mailutils for testing)
sudo apt install -y mailutils
echo "Test email" | mail -s "Test" info@mangalprime.com

# Verify .env SMTP settings
cat .env | grep SMTP
```

### Permission issues
```bash
# Fix ownership
sudo chown -R mangalprime:mangalprime ~/public_html

# Fix permissions
chmod 755 ~/public_html
chmod -R 755 ~/public_html/public
chmod 600 ~/public_html/.env
```

---

## Important Notes

1. **Security**: Never commit `.env` file to Git
2. **Backups**: Regularly backup your `.env` file and database (if applicable)
3. **Updates**: Keep Node.js dependencies updated (`npm update` when needed)
4. **Monitoring**: Consider setting up monitoring tools (PM2 Plus, Uptime Robot, etc.)
5. **SSL Auto-renewal**: Certbot sets up automatic renewal, but verify it works with `sudo certbot renew --dry-run`
6. **Existing Server**: Since this is an existing server, only install/config what's missing - don't modify existing configurations unnecessarily
7. **CRITICAL - Virtualmin and Nginx**: After ANY Virtualmin configuration changes (creating virtual server, proxy settings, SSL), ALWAYS restart Nginx using `systemctl stop nginx` then `systemctl start nginx`. Do NOT use `reload` as it may fail with IPv6 bind errors. This is essential for Virtualmin configurations to take effect.

---

## Quick Reference Commands

```bash
# Application management
pm2 status
pm2 restart mangalprime
pm2 logs mangalprime
pm2 stop mangalprime
pm2 start mangalprime

# Nginx management (CRITICAL: Use stop + start after Virtualmin changes)
sudo systemctl status nginx
sudo nginx -t
sudo systemctl stop nginx
sudo systemctl start nginx
# Note: Use stop + start instead of reload after Virtualmin configuration changes

# Update deployment
cd ~/public_html && git pull && npm install --production && pm2 restart mangalprime
```

---

## Checklist

- [ ] Server access verified
- [ ] User confirmed (existing or new)
- [ ] Firewall checked/configured (UFW)
- [ ] Node.js and npm verified/installed
- [ ] PM2 verified/installed globally
- [ ] Virtual server created in Virtualmin (Step 5)
- [ ] Virtual server configured as reverse proxy to Node.js app
- [ ] **Nginx restarted (stop + start) after Virtualmin configuration** (CRITICAL)
- [ ] DNS configured (domain pointing to server IP)
- [ ] SSL certificate obtained (Let's Encrypt)
- [ ] **Nginx restarted (stop + start) after SSL installation** (CRITICAL)
- [ ] Git verified/installed and repository cloned
- [ ] Application dependencies installed
- [ ] Environment variables configured (.env)
- [ ] PM2 process manager configured
- [ ] Application tested and running
- [ ] Email functionality tested
- [ ] SSL auto-renewal verified (if Certbot was newly installed)

---

**Setup Complete!** Your Mangal Prime landing page should now be live at https://mangalprime.com

