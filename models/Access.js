const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const AccessSchema = new mongoose.Schema({
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'group',
  },
  type: { type: String, required: true },
  read: { type: Boolean, default: false },
  write: { type: Boolean, default: false },
});

module.exports = Access = mongoose.model('access', AccessSchema);
