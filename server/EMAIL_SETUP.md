# Email Configuration Setup Guide

## Environment Variables Required

Add these environment variables to your `.env` file in the server directory:

```env
# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=DropMe <your-email@gmail.com>

# Optional: For Gmail with App Password
# 1. Enable 2-factor authentication on your Gmail account
# 2. Generate an App Password: https://myaccount.google.com/apppasswords
# 3. Use the App Password as SMTP_PASS
```

## Alternative SMTP Providers

### Gmail (Recommended for development)
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### Outlook/Hotmail
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-password
```

### SendGrid (Production)
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=YOUR_SENDGRID_API_KEY
```

### Mailgun (Production)
```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=postmaster@your-domain.mailgun.org
SMTP_PASS=YOUR_MAILGUN_PASSWORD
```

## Testing Email Configuration

You can test the email setup using the test utilities:

```javascript
import { testEmailConfiguration, testBasicEmailSend } from './src/utils/emailTest.js';

// Test basic configuration
await testEmailConfiguration();

// Test sending a basic email
await testBasicEmailSend('test@example.com');
```

## Common Issues and Solutions

### 1. Gmail Authentication Issues
- Enable "Less secure app access" OR use App Passwords
- Make sure 2FA is enabled if using App Passwords
- Check Gmail spam folder for test emails

### 2. Port Issues
- Use port 587 for TLS
- Use port 465 for SSL
- Use port 25 for unencrypted (not recommended)

### 3. Firewall/Network Issues
- Make sure SMTP ports are open
- Check if your hosting provider blocks SMTP traffic

### 4. Rate Limiting
- Gmail: ~100 emails/day for regular accounts
- SendGrid/Mailgun: Higher limits based on plan

## Production Considerations

1. **Use a dedicated email service** like SendGrid, Mailgun, or AWS SES
2. **Set up proper domain authentication** (SPF, DKIM, DMARC)
3. **Monitor email deliverability** and bounce rates
4. **Implement unsubscribe functionality** for marketing emails
5. **Use email templates** for consistent branding

## Security Notes

- Never commit email credentials to version control
- Use environment variables or secret management
- Rotate email passwords regularly
- Monitor for unauthorized email usage

## Troubleshooting

If emails are not sending:

1. Check server logs for error messages
2. Verify SMTP credentials are correct
3. Test network connectivity to SMTP server
4. Check email spam/junk folders
5. Verify email addresses are valid

The improved email system now includes:
- Automatic retry mechanism (3 attempts with exponential backoff)
- Better error logging and debugging
- Connection pooling and timeout configuration
- Asynchronous email sending to avoid blocking payment processing
