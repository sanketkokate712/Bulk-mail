const mongoose = require('mongoose');

const recipientSchema = new mongoose.Schema({
  campaignId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campaign',
    required: true
  },
  index: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'sent', 'bounced', 'failed'],
    default: 'pending'
  },
  message: {
    type: String,
    default: null
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, { timestamps: true });

// Create compound index to quickly find recipients for a campaign ordered by index
recipientSchema.index({ campaignId: 1, index: 1 });

module.exports = mongoose.model('Recipient', recipientSchema);
