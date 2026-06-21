const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Campaign = require('../models/Campaign');
const Recipient = require('../models/Recipient');

// GET all campaigns for the authenticated user
router.get('/', auth, async (req, res) => {
  try {
    const campaigns = await Campaign.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(campaigns);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// GET a specific campaign and its recipients
router.get('/:id', auth, async (req, res) => {
  try {
    const campaign = await Campaign.findOne({ _id: req.params.id, userId: req.user.id }).lean();
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    const recipients = await Recipient.find({ campaignId: req.params.id }).sort({ index: 1 }).lean();
    
    res.json({ campaign, recipients });
  } catch (err) {
    console.error(err);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Campaign not found' });
    }
    res.status(500).json({ message: 'Server Error' });
  }
});

// POST create a new campaign
router.post('/', auth, async (req, res) => {
  try {
    const { metadata, recipients } = req.body;

    const campaign = new Campaign({
      userId: req.user.id,
      name: metadata.subject || 'Untitled Campaign',
      template: metadata,
      totalRecipients: recipients.length,
      pendingCount: recipients.length,
      status: 'draft'
    });

    await campaign.save();

    // Prepare recipients for batch insert
    const recipientDocs = recipients.map((r, i) => ({
      campaignId: campaign._id,
      index: i,
      status: 'pending',
      data: r
    }));

    await Recipient.insertMany(recipientDocs);

    res.status(201).json({ id: campaign._id, message: 'Campaign created successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// PUT update campaign status
router.put('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    
    let campaign = await Campaign.findOne({ _id: req.params.id, userId: req.user.id });
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    campaign.status = status;
    await campaign.save();

    res.json({ message: 'Status updated', status });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// PUT update recipient status
router.put('/:id/recipients/:recipientId', auth, async (req, res) => {
  try {
    const { status, message } = req.body;

    // Verify campaign belongs to user first
    const campaign = await Campaign.findOne({ _id: req.params.id, userId: req.user.id });
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    const recipient = await Recipient.findOne({ _id: req.params.recipientId, campaignId: req.params.id });
    if (!recipient) {
      return res.status(404).json({ message: 'Recipient not found' });
    }

    const oldStatus = recipient.status;
    recipient.status = status;
    recipient.message = message;
    await recipient.save();

    // Adjust campaign counts based on status change
    if (oldStatus !== status) {
      let updates = { $inc: {} };
      if (oldStatus === 'pending') updates.$inc.pendingCount = -1;
      if (oldStatus === 'sent') updates.$inc.sentCount = -1;
      if (oldStatus === 'bounced') updates.$inc.bouncedCount = -1;
      if (oldStatus === 'failed') updates.$inc.failedCount = -1;

      if (status === 'pending') updates.$inc.pendingCount = 1;
      if (status === 'sent') updates.$inc.sentCount = 1;
      if (status === 'bounced') updates.$inc.bouncedCount = 1;
      if (status === 'failed') updates.$inc.failedCount = 1;

      await Campaign.updateOne({ _id: req.params.id }, updates);
    }

    res.json({ message: 'Recipient updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
