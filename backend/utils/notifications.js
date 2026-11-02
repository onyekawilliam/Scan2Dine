const sgMail = require('@sendgrid/mail');
const twilio = require('twilio');
const logger = require('./logger');

// SendGrid Configuration
sgMail.setApiKey(process.env.SENDGRID_API_KEY || 'mock_sendgrid_key');

// Twilio Configuration
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID || 'mock_sid',
  process.env.TWILIO_AUTH_TOKEN || 'mock_token'
);

const sendEmail = async (to, subject, html) => {
  try {
    if (process.env.SENDGRID_API_KEY) {
      await sgMail.send({
        to,
        from: 'noreply@scan2dine.com',
        subject,
        html,
      });
      logger.info(`Email sent to ${to}`);
    } else {
      logger.info(`[MOCK EMAIL] To: ${to} | Subject: ${subject}`);
    }
  } catch (error) {
    logger.error('Error sending email:', error);
  }
};

const sendSMS = async (to, body) => {
  try {
    if (process.env.TWILIO_ACCOUNT_SID) {
      await twilioClient.messages.create({
        body,
        from: process.env.TWILIO_PHONE_NUMBER || '+1234567890',
        to,
      });
      logger.info(`SMS sent to ${to}`);
    } else {
      logger.info(`[MOCK SMS] To: ${to} | Body: ${body}`);
    }
  } catch (error) {
    logger.error('Error sending SMS:', error);
  }
};

module.exports = {
  sendEmail,
  sendSMS
};
