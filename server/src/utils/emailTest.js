/**
 * Email functionality test utility
 * Can be used to test email configuration and sending
 */

import { getMailer, sendTrainTicketEmail, sendBusTicketEmail } from './mailer.js';
import { sendEmailWithRetry } from './emailRetry.js';

export async function testEmailConfiguration() {
  console.log('Testing email configuration...');
  
  const transporter = getMailer();
  if (!transporter) {
    console.error('Email transporter not configured');
    return false;
  }
  
  try {
    await transporter.verify();
    console.log('Email configuration is valid');
    return true;
  } catch (error) {
    console.error('Email configuration test failed:', error);
    return false;
  }
}

export async function testBasicEmailSend(toEmail) {
  console.log(`Testing basic email send to: ${toEmail}`);
  
  const transporter = getMailer();
  if (!transporter) {
    console.error('Email transporter not available');
    return false;
  }
  
  try {
    const result = await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: toEmail,
      subject: 'DropMe Email Test',
      text: 'This is a test email from DropMe to verify email functionality.',
      html: '<h1>DropMe Email Test</h1><p>This is a test email from DropMe to verify email functionality.</p>'
    });
    
    console.log(`Test email sent successfully. Message ID: ${result.messageId}`);
    return true;
  } catch (error) {
    console.error('Test email send failed:', error);
    return false;
  }
}

export async function testEmailRetry(toEmail) {
  console.log(`Testing email retry mechanism to: ${toEmail}`);
  
  const success = await sendEmailWithRetry(async () => {
    const transporter = getMailer();
    if (!transporter) return false;
    
    const result = await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: toEmail,
      subject: 'DropMe Retry Test',
      text: 'This is a test email with retry mechanism.',
    });
    
    return !!result.messageId;
  }, 3, 1000);
  
  console.log(`Email retry test ${success ? 'passed' : 'failed'}`);
  return success;
}

// Function to test with mock data
export async function testTrainTicketEmailWithMock(toEmail) {
  console.log(`Testing train ticket email with mock data to: ${toEmail}`);
  
  const mockBooking = {
    _id: 'test-booking-123',
    passengerSnapshot: {
      name: 'Test Passenger',
      email: toEmail
    },
    boardingStationName: 'Colombo Fort',
    destinationStationName: 'Kandy',
    travelDate: '2024-12-25',
    seats: 2,
    totalFareLkr: 500
  };
  
  // Create a simple PDF buffer mock
  const mockPdfBuffer = Buffer.from('Mock PDF content');
  
  try {
    const success = await sendEmailWithRetry(async () => {
      return await sendTrainTicketEmail({
        to: toEmail,
        name: 'Test Passenger',
        booking: mockBooking,
        pdfBuffer: mockPdfBuffer
      });
    }, 3, 1000);
    
    console.log(`Train ticket email test ${success ? 'passed' : 'failed'}`);
    return success;
  } catch (error) {
    console.error('Train ticket email test failed:', error);
    return false;
  }
}

export async function testBusTicketEmailWithMock(toEmail) {
  console.log(`Testing bus ticket email with mock data to: ${toEmail}`);
  
  const mockBooking = {
    _id: 'test-bus-booking-123',
    passengerSnapshot: {
      name: 'Test Passenger',
      email: toEmail
    },
    pickupStop: {
      label: 'Colombo Bus Stand',
      time: '08:00'
    },
    dropoffStop: {
      label: 'Kandy Bus Stand',
      time: '11:00'
    },
    journeySnapshot: {
      busNumber: 'NB-1234',
      routeNumber: '1',
      routeLabel: 'Colombo - Kandy Express'
    },
    travelDate: '2024-12-25',
    seatNumbers: ['A1', 'A2'],
    totalAmountLkr: 800
  };
  
  // Create a simple PDF buffer mock
  const mockPdfBuffer = Buffer.from('Mock PDF content');
  
  try {
    const success = await sendEmailWithRetry(async () => {
      return await sendBusTicketEmail({
        to: toEmail,
        name: 'Test Passenger',
        booking: mockBooking,
        pdfBuffer: mockPdfBuffer
      });
    }, 3, 1000);
    
    console.log(`Bus ticket email test ${success ? 'passed' : 'failed'}`);
    return success;
  } catch (error) {
    console.error('Bus ticket email test failed:', error);
    return false;
  }
}
