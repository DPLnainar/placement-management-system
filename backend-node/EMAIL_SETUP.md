# Email Setup Instructions

## Gmail Configuration

To enable email sending for password reset, you need to set up Gmail App Password:

### Step 1: Enable 2-Factor Authentication
1. Go to your Google Account: https://myaccount.google.com/
2. Click on **Security** in the left sidebar
3. Under "Signing in to Google", click on **2-Step Verification**
4. Follow the steps to enable 2FA if not already enabled

### Step 2: Generate App Password
1. After enabling 2FA, go back to Security settings
2. Click on **App passwords** (or visit https://myaccount.google.com/apppasswords)
3. Select app: **Mail**
4. Select device: **Other (Custom name)** → Enter "Placement Portal"
5. Click **Generate**
6. Copy the 16-character password (it will look like: `xxxx xxxx xxxx xxxx`)

### Step 3: Update .env File
Edit `backend-node/.env` and replace:

```
EMAIL_USER=your-email@gmail.com          # Your Gmail address
EMAIL_PASSWORD=your-app-password-here    # The 16-character app password (remove spaces)
```

Example:
```
EMAIL_USER=myemail@gmail.com
EMAIL_PASSWORD=abcdwxyzabcdwxyz
```

### Step 4: Restart Backend Server
Stop and restart the backend server for changes to take effect.

## Testing

1. Go to login page
2. Click "Forgot password?"
3. Enter username and registered email
4. Check the email inbox for reset link
5. Click link to reset password

## Alternative: Using Other Email Services

### Outlook/Hotmail
```
service: 'outlook'
```

### Custom SMTP
```javascript
host: 'smtp.yourdomain.com',
port: 587,
secure: false,
auth: {
  user: 'your-email@yourdomain.com',
  pass: 'your-password'
}
```

## Troubleshooting

- **"Less secure app access"**: Not needed with App Password
- **Email not received**: Check spam folder
- **Authentication failed**: Regenerate App Password
- **Connection timeout**: Check firewall/antivirus settings
