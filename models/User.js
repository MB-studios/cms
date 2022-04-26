const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const UserSchema = new mongoose.Schema(
	{
		name: { type: String },
		email: { type: String, required: true, unique: true },
		password: { type: String },
		hasPassword: { type: Boolean, default: false },
		activated: { type: Boolean, required: true, default: false },
		activationCode: { type: String, default: uuidv4 },
		passwordResetCode: { type: String, default: null },
		passwordResetTime: { type: Date, default: null },
		groups: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: 'Group',
			},
		],
		date: { type: Date, default: Date.now },
		oneTimeCode: { type: String, default: null },
		oneTimeCodeExpires: { type: Date, default: null },
		lastLogin: { type: Date },
	},
	{ timestamps: true }
);

module.exports = User = mongoose.model('user', UserSchema);
