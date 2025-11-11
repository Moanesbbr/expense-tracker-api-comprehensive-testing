/**
 * Unit Tests for Email Manager
 * White-box testing approach
 */

const nodemailer = require('nodemailer');
const emailManager = require('../../managers/emailManager');

// Mock dependencies
jest.mock('nodemailer');

describe('Email Manager', () => {
  let mockTransport;

  beforeEach(() => {
    mockTransport = {
      sendMail: jest.fn().mockResolvedValue({
        messageId: 'mock_message_id',
      }),
    };

    nodemailer.createTransport.mockReturnValue(mockTransport);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Email Sending', () => {
    test('should send email successfully', async () => {
      const to = 'test@example.com';
      const text = 'Test email text';
      const html = '<h1>Test email HTML</h1>';
      const subject = 'Test Subject';

      await emailManager(to, text, html, subject);

      expect(nodemailer.createTransport).toHaveBeenCalledWith({
        host: 'sandbox.smtp.mailtrap.io',
        port: 2525,
        auth: {
          user: '3d3f75027b3d06',
          pass: '82945ba6f6f768',
        },
      });

      expect(mockTransport.sendMail).toHaveBeenCalledWith({
        to: 'test@example.com',
        from: 'info@expensetracker.com',
        text: 'Test email text',
        html: '<h1>Test email HTML</h1>',
        subject: 'Test Subject',
      });
    });

    test('should send password reset email with correct format', async () => {
      const to = 'user@example.com';
      const resetCode = '12345';
      const text = `Your password reset code is ${resetCode}`;
      const html = `<h1> Your password reset code is ${resetCode} </h1>`;
      const subject = 'Reset your password - Expense tracker PRO NodeJS Masterclass';

      await emailManager(to, text, html, subject);

      expect(mockTransport.sendMail).toHaveBeenCalledWith({
        to: 'user@example.com',
        from: 'info@expensetracker.com',
        text: 'Your password reset code is 12345',
        html: '<h1> Your password reset code is 12345 </h1>',
        subject: 'Reset your password - Expense tracker PRO NodeJS Masterclass',
      });
    });

    test('should handle email sending errors', async () => {
      const error = new Error('Email sending failed');
      mockTransport.sendMail.mockRejectedValue(error);

      await expect(
        emailManager('test@example.com', 'text', 'html', 'subject')
      ).rejects.toThrow('Email sending failed');
    });
  });
});

