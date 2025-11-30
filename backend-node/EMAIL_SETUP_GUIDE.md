# Email Configuration Guide

This guide will help you set up email notifications for the Placement Management System.

## 📧 Email Features

Once configured, the system will send automatic emails for:

- ✉️ **Welcome emails** when users are created
- 📨 **Invitation emails** for student registration
- 🔑 **Password reset** emails
- 📋 **Application confirmations** 
- 🎉 **Offer letter** notifications
- 📢 **Job posting** alerts
- 📊 **Application status** updates
- 📅 **Interview schedule** notifications
- 🔔 **Placement drive** announcements

## 🚀 Quick Setup (Gmail)

### Step 1: Generate App Password

1. Go to your Google Account: https://myaccount.google.com
2. Select **Security**
3. Under "Signing in to Google," select **2-Step Verification** (enable if not already)
4. At the bottom, select **App passwords**
5. Select **Mail** and **Other (Custom name)**
6. Enter "Placement Portal" and click **Generate**
7. Copy the 16-character password (e.g., `abcd efgh ijkl mnop`)

### Step 2: Update .env File

Edit `backend-node/.env` and add:

```env
# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=abcdefghijklmnop
EMAIL_FROM=noreply@yourcollegename.edu
EMAIL_FROM_NAME=Placement Portal
ENABLE_EMAIL=true
```

**Replace:**
- `your-email@gmail.com` with your Gmail address
- `abcdefghijklmnop` with the 16-character app password (no spaces)
- `noreply@yourcollegename.edu` with your preferred sender email

### Step 3: Restart Backend

```bash
cd backend-node
npm start
```

✅ **Email system is now active!**

## 🔧 Alternative Email Providers

### Using Outlook/Hotmail

```env
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@outlook.com
EMAIL_PASSWORD=your-password
```

### Using Custom SMTP Server

```env
EMAIL_HOST=smtp.yourdomain.com
EMAIL_PORT=587
EMAIL_SECURE=true
EMAIL_USER=noreply@yourdomain.com
EMAIL_PASSWORD=your-smtp-password
```

### Using SendGrid

```env
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASSWORD=your-sendgrid-api-key
```

### Using Mailgun

```env
EMAIL_HOST=smtp.mailgun.org
EMAIL_PORT=587
EMAIL_USER=postmaster@your-domain.mailgun.org
EMAIL_PASSWORD=your-mailgun-password
```

## 🧪 Testing Email

Test your email configuration:

```bash
cd backend-node
node -e "
const notificationService = require('./utils/notificationService');
notificationService.sendEmail({
  to: 'test@example.com',
  subject: 'Test Email',
  html: '<h1>Email is working!</h1>',
  text: 'Email is working!'
}).then(result => console.log('Result:', result));
"
```

## ⚙️ Email Settings Reference

| Setting | Description | Example |
|---------|-------------|---------|
| `EMAIL_HOST` | SMTP server hostname | `smtp.gmail.com` |
| `EMAIL_PORT` | SMTP port (usually 587 or 465) | `587` |
| `EMAIL_SECURE` | Use TLS (true for port 465) | `false` |
| `EMAIL_USER` | SMTP username/email | `portal@college.edu` |
| `EMAIL_PASSWORD` | SMTP password or app password | `abcdefgh12345678` |
| `EMAIL_FROM` | Sender email address | `noreply@college.edu` |
| `EMAIL_FROM_NAME` | Sender display name | `Placement Portal` |
| `ENABLE_EMAIL` | Enable/disable emails | `true` or `false` |

## 🛡️ Security Best Practices

1. **Never commit** `.env` file to version control
2. **Use app passwords** instead of main account passwords
3. **Enable 2FA** on your email account
4. **Use dedicated** email account for the portal
5. **Monitor usage** to detect unauthorized access
6. **Rotate passwords** periodically

## 📊 Email Sending Limits

### Gmail
- **Free:** 500 emails/day
- **Google Workspace:** 2,000 emails/day
- **Recommendation:** For >500 users, use SendGrid/Mailgun

### SendGrid (Free Tier)
- **100 emails/day** forever free
- Great for production use

### Mailgun (Free Tier)
- **5,000 emails/month** for 3 months
- Then pay-as-you-go

## 🐛 Troubleshooting

### "Invalid login" error
- Check EMAIL_USER and EMAIL_PASSWORD are correct
- Ensure you're using app password, not regular password
- Enable "Less secure app access" (not recommended) or use app password

### "Connection timeout" error
- Check EMAIL_HOST and EMAIL_PORT
- Verify firewall isn't blocking outgoing SMTP
- Try alternative ports (465, 25)

### Emails going to spam
- Configure SPF, DKIM, and DMARC records for your domain
- Use a professional email service (SendGrid, Mailgun)
- Don't use generic Gmail for production

### "Too many recipients" error
- You've hit Gmail's daily limit
- Use bulk email service or reduce recipients

## 📝 Disabling Email Notifications

To temporarily disable emails without removing configuration:

```env
ENABLE_EMAIL=false
```

Or remove EMAIL_USER and EMAIL_PASSWORD from `.env`.

## 🎯 Production Recommendations

For production deployments:

1. **Use professional email service** (SendGrid, Mailgun, AWS SES)
2. **Set up email domain** with proper SPF/DKIM records
3. **Monitor bounce rates** and unsubscribes
4. **Implement email queue** for bulk sending
5. **Add email preferences** for users to opt-in/out
6. **Log all emails** sent for audit purposes

## 📧 Support

For issues with email setup:
1. Check backend logs for error messages
2. Verify .env configuration
3. Test with simple email first
4. Check email provider's documentation

---

**Email system is a critical feature for user engagement and notifications. Proper configuration ensures smooth communication!** 📨✨
