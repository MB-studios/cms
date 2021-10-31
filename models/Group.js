const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const GroupSchema = new mongoose.Schema({
  name: { type: String, required: true },
  users: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user',
    },
  ],
  access: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'access',
    },
  ],
});

module.exports = Group = mongoose.model('group', GroupSchema);
