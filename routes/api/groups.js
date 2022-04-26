const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { check, validationResult } = require('express-validator');

const { GROUPS, ACCESS } = require('../../client/src/config/accessTypes');
const { auth } = require('../../middleware/auth');
const User = require('../../models/User');
const Group = require('../../models/Group');
const Access = require('../../models/Access');

// @route   POST api/groups
// @desc    Create group
// @access  Private
router.post(
	'/',

	auth({ type: GROUPS, read: true, write: true }),
	[check('name', 'Name is required').not().isEmpty()],
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(200).json({ errors: errors.array() });
		}

		const { name } = req.body;

		try {
			let group = Group({ name });

			await group.save();
			return res.json(group);
		} catch (error) {
			console.error(error);
			res.status(500).send('Server error');
		}
	}
);

// @route   GET api/groups
// @desc    Get all groups
// @access  Private
router.get('/', auth({ type: GROUPS, read: true, write: false }), async (req, res) => {
	try {
		const groups = await Group.find().populate('access');
		res.json(groups);
	} catch (error) {
		res.status(500).send('Server Error');
	}
});

// @route   GET api/groups/:group_id
// @desc    Get group by ID
// @access  Private
router.get(
	'/:group_id',

	auth({ type: GROUPS, read: true, write: false }),
	async (req, res) => {
		try {
			const group = await Group.findOne({
				_id: req.params.group_id,
			});

			if (!group) {
				return res.status(200).json({ errors: [{ param: 'email', msg: 'Group not found' }] });
			}

			res.json(group);
		} catch (error) {
			console.error(error.message);
			if (error.kind == 'ObjectId') {
				return res.status(200).json({ errors: [{ param: 'email', msg: 'Group not found' }] });
			}
			res.status(500).send('Server error');
		}
	}
);

// @route   POST api/groups/user
// @desc    Add user to group
// @access  Private
router.post(
	'/user',
	[
		auth({ type: GROUPS, read: true, write: true }),
		[check('group', 'Group ID is required').not().isEmpty(), check('user', 'User ID is required').not().isEmpty()],
	],
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(200).json({ errors: errors.array() });
		}

		const { group, user } = req.body;

		const inputFields = {};
		inputFields.group = group;
		inputFields.user = user;

		try {
			let group = await Group.findOne({
				_id: inputFields.group,
			});

			if (!group) {
				return res.status(200).json({ errors: [{ msg: 'Group not found' }] });
			}

			let user = await User.findOne({
				_id: inputFields.user,
			}).select('-password');

			if (!user) {
				return res.status(200).json({ errors: [{ msg: 'User not found' }] });
			}

			group.users.push(user);
			await group.save();

			user.groups.push(group);
			await user.save();

			res.json(group);
		} catch (error) {
			if (error.kind == 'ObjectId') {
				return res.status(200).json({ errors: [{ msg: 'Invalid ObjectID' }] });
			}
			console.error(error.message);
			res.status(500).send('Server error');
		}
	}
);

// @route   POST api/groups/setuser
// @desc    Add user to group
// @access  Private
router.post(
	'/setuser',
	[
		auth({ type: GROUPS, read: true, write: true }),
		[
			check('userId', 'User ID is required').not().isEmpty(),
			check('groupName', 'Group name is required').not().isEmpty(),
			check('setMember', 'set member is required').not().isEmpty(),
		],
	],
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(200).json({ errors: errors.array() });
		}

		const { userId, groupName, setMember } = req.body;

		try {
			let group = await Group.findOne({
				name: groupName,
			});

			if (!group) {
				return res.status(200).json({ errors: [{ msg: 'Group not found' }] });
			}

			let user = await User.findOne({
				_id: userId,
			})
				.select(
					'-password -hasPassword -passwordResetCode -passwordResetTime -oneTimeCode -oneTimeCodeExpires -activationCode'
				)
				.populate('groups');

			if (!user) {
				return res.status(200).json({ errors: [{ msg: 'User not found' }] });
			}

			if (setMember === true) {
				group.users.push(user);
				user.groups.push(group);
			} else {
				group.users = group.users.filter((u) => {
					return u._id.toString() !== user._id.toString();
				});
				user.groups = user.groups.filter((g) => {
					return g._id.toString() !== group._id.toString();
				});
			}

			await group.save();
			await user.save();

			res.json(user);
		} catch (error) {
			if (error.kind == 'ObjectId') {
				return res.status(200).json({ errors: [{ msg: 'Invalid ObjectID' }] });
			}
			console.error(error.message);
			res.status(500).send('Server error');
		}
	}
);

// @route   POST api/groups/access
// @desc    Add access to group
// @access  Private
router.post(
	'/access',
	[
		auth({ type: ACCESS, read: true, write: true }),
		[
			check('group', 'Group ID is required').isMongoId(),
			check('type', 'Type is required').isAlpha(),
			check('read', 'Read is required').isBoolean(),
			check('write', 'Write is required').isBoolean(),
		],
	],
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(200).json({ errors: errors.array() });
		}

		const { group, type, read, write } = req.body;

		const inputFields = {};
		inputFields.group = group;
		inputFields.type = type;
		inputFields.read = read;
		inputFields.write = write;

		try {
			let g = await Group.findOne({
				_id: inputFields.group,
			}).populate('access');

			if (!g) {
				return res.status(200).json({ errors: [{ msg: 'Group not found' }] });
			}

			var access = g.access.find((a) => a.type === inputFields.type);

			if (access) {
				access = await Access.findOneAndUpdate({ _id: access._id }, inputFields, { new: true });
				g = await Group.findOne({
					_id: inputFields.group,
				}).populate('access');
			} else {
				access = new Access(inputFields);
				await access.save();
				g.access.push(access);
				await g.save();
			}

			res.json(g);
		} catch (error) {
			console.error(error.message);
			res.status(500).send('Server error');
		}
	}
);

module.exports = router;
