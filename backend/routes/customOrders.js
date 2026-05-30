const express = require('express');
const CustomOrder = require('../models/CustomOrder');
const { auth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Helper to send email via Brevo API using the built-in fetch available in Node 18+
async function sendBrevoEmail(subject, htmlContent, toArr, ccArr = null, replyTo = null) {
  const brevoApiKey = process.env.BREVO_API_KEY;
  const brevoSenderEmail = process.env.BREVO_SENDER_EMAIL;
  if (!brevoApiKey) {
    console.warn("BREVO_API_KEY is not set. Email not sent.");
    return { success: false, reason: 'BREVO_API_KEY is missing' };
  }
  if (!brevoSenderEmail) {
    console.warn("BREVO_SENDER_EMAIL is not set. Email not sent.");
    return { success: false, reason: 'BREVO_SENDER_EMAIL is missing' };
  }

  try {
    const payload = {
      sender: { name: "Hira Jewels", email: brevoSenderEmail },
      to: toArr,
      subject,
      htmlContent,
    };

    if (ccArr && ccArr.length > 0) {
      payload.cc = ccArr;
    }

    if (replyTo) {
      payload.replyTo = replyTo;
    }

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'api-key': brevoApiKey,
      },
      body: JSON.stringify(payload),
    });

    const rawBody = await response.text();
    let result = null;
    if (rawBody) {
      try {
        result = JSON.parse(rawBody);
      } catch (parseError) {
        result = { raw: rawBody };
      }
    }

    if (!response.ok) {
      console.error('Brevo email request failed:', {
        status: response.status,
        statusText: response.statusText,
        result,
      });
      return {
        success: false,
        reason: (result && (result.message || result.code)) || `Brevo request failed (${response.status})`,
      };
    }

    console.log('Brevo email sent:', result);
    return { success: true, result };
  } catch (error) {
    console.error("Error sending email via Brevo:", error);
    return { success: false, reason: error.message || 'Email send failed' };
  }
}

// POST new custom order
router.post('/', async (req, res) => {
  try {
    const { name, email, mobile, designCategory, note } = req.body;
    
    if (!name || !email || !mobile || !designCategory || !note) {
      return res.status(400).json({ success: false, error: 'All fields are required' });
    }

    const customOrder = new CustomOrder({
      name,
      email,
      mobile,
      designCategory,
      note
    });

    await customOrder.save();

    // Email to User
    const emailHtml = `
      <h2>Custom Jewelry Request Details</h2>
      <p>Hello ${name},</p>
      <p>Thank you for submitting your custom jewelry request! Here is a copy of the details you provided:</p>
      <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Mobile:</strong> ${mobile}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Category:</strong> ${designCategory}</p>
        <p><strong>Notes/Requirements:</strong><br/>${note.replace(/\n/g, '<br/>')}</p>
      </div>
      <p>Our team has received this and will review your request shortly. We will reply directly to this email with any follow-up questions or a preliminary quote.</p>
      <br />
      <p>Best Regards,</p>
      <p>Hira Jewels Team</p>
    `;

    const adminEmail = process.env.ADMIN_EMAIL || 'studio.hirajewels@gmail.com';
    const emailResult = await sendBrevoEmail(
      `Custom Order Request: ${designCategory} - ${name}`,
      emailHtml,
      [{ email, name }],
      [{ email: adminEmail, name: 'Hira Jewels Admin' }],
      { email: adminEmail, name: 'Hira Jewels Admin' }
    );

    if (!emailResult.success) {
      console.warn('Custom order saved but confirmation email failed:', emailResult.reason);
    }

    res.status(201).json({
      success: true,
      data: customOrder,
      message: emailResult.success
        ? 'Custom order submitted successfully'
        : 'Custom order submitted, but confirmation email could not be sent right now',
      emailSent: emailResult.success,
      emailWarning: emailResult.success ? null : `Email delivery failed: ${emailResult.reason}`,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// GET all custom orders (Admin)
router.get('/', auth, requireAdmin, async (req, res) => {
  try {
    const customOrders = await CustomOrder.find().sort({ createdAt: -1 });
    res.json({ success: true, data: customOrders });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// PUT update status (Admin)
router.put('/:id', auth, requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const customOrder = await CustomOrder.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!customOrder) return res.status(404).json({ success: false, error: 'Custom order not found' });
    res.json({ success: true, data: customOrder });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// DELETE custom order (Admin only)
router.delete('/:id', auth, requireAdmin, async (req, res) => {
  try {
    const customOrder = await CustomOrder.findByIdAndDelete(req.params.id);
    if (!customOrder) return res.status(404).json({ success: false, error: 'Custom order not found' });
    res.json({ success: true, message: 'Custom order deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

module.exports = router;
