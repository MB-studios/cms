const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  activated: { type: Boolean, required: true, default: false },
  activationCode: { type: String, default: uuidv4 },
  passwordResetCode: { type: String, default: null },
  passwordResetTime: { type: Date, default: null },
  groups: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'group',
    },
  ],
  date: { type: Date, default: Date.now },
  oneTimeCode: { type: String, default: null },
  oneTimeCodeExpires: { type: Date, default: null },
});

module.exports = User = mongoose.model('user', UserSchema);
