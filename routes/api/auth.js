const express = require('express');

const router = express.Router();

const bcrypt = require('bcryptjs');

const { auth } = require('../../middleware/auth');

const { USERS } = require('../../client/src/config/accessTypes');

const jwt = require('jsonwebtoken');

const config = require('config');

const { check, validationResult } = require('express-validator');

const mailgun = require('../../config/mailgun');
const randomize = require('randomatic');
const moment = require('moment');

const User = require('../../models/User');
//const Group = require('../../models/Group');
//const Access = require('../../models/Access');

// @route   GET api/auth
// @desc    Get user from token
// @access  Private

router.get(
	'/',

	auth(),

	async (req, res) => {
		try {
			const user = await User.findById(req.user.id)

				.select('id name email hasPassword')

				.populate({
					path: 'groups',

					select: 'id name access',

					populate: { path: 'access', select: 'id type read write' },
				});

			if (!user) {
				return res.status(200).json({ errors: [{ msg: 'Invalid Token' }] });
			}

			res.json(user);
		} catch (error) {
			console.error(error.message);

			res.status(500).send('Server Error');
		}
	}
);

// @route   POST api/auth
// @desc    Authenticate user and get token
// @access  Public

router.post(
	'/',

	[check('email', 'Please include a vaild email').isEmail(), check('password', 'Password is required').exists()],

	async (req, res) => {
		const errors = validationResult(req);

		if (!errors.isEmpty()) {
			return res.status(200).json({ errors: errors.array() });
		}

		var { email, password } = req.body;

		email = email.toLowerCase();

		try {
			//let user = await User.findOne({ email });

			const user = await User.findOne({ email })

				.select('id name email password activated oneTimeCode oneTimeCodeExpires')

				.populate({
					path: 'groups',

					select: 'id name access',

					populate: { path: 'access', select: 'id type read write' },
				});

			if (!user) {
				return res.status(200).json({ errors: [{ msg: 'Invalid Credentials' }] });
			}

			user.lastLogin = moment();
			await user.save();

			const payload = {
				user: {
					id: user.id,

					name: user.name,

					groups: user.groups,
				},
			};

			if (user.oneTimeCode && user.oneTimeCode === password) {
				if (!user.oneTimeCodeExpires || moment().isAfter(user.oneTimeCodeExpires)) {
					return res.status(200).json({ errors: [{ msg: 'Code Expired' }] });
				} else {
					user.oneTimeCode = undefined;
					await user.save();
					let token = await jwt.sign(
						payload,

						config.get('jwtSecret'),

						{
							expiresIn: config.get('oneTimeCodeExpires'),
						}
					);
					return res.json({ token });
				}
			}

			if (!user.activated) {
				return res.status(200).json({ errors: [{ msg: 'Account not activated' }] });
			}

			const isMatch = user.password && (await bcrypt.compare(password, user.password));

			if (!isMatch) {
				return res.status(200).json({ errors: [{ msg: 'Invalid Credentials' }] });
			}

			jwt.sign(
				payload,

				config.get('jwtSecret'),

				{
					expiresIn: config.get('jwtExpires'),
				},

				(err, token) => {
					if (err) throw err;

					res.json({ token });
				}
			);
		} catch (error) {
			console.error(error);

			res.status(500).send('Server error');
		}
	}
);

// @route   POST api/auth/getonetimecode
// @desc    Send one time code to given email
// @access  Public
router.post(
	'/getonetimecode',

	[check('email', 'Please include a vaild email').isEmail()],

	async (req, res) => {
		const errors = validationResult(req);

		if (!errors.isEmpty()) {
			return res.status(200).json({ errors: errors.array() });
		}

		var { email } = req.body;

		email = email.toLowerCase();

		try {
			var user = await User.findOne({ email });

			if (!user) {
				user = new User({
					email,
					activated: !config.get('activationRequired'),
				});

				const salt = await bcrypt.genSalt(10);

				user.password = 'onetimelogin';

				await user.save();
			}

			var now = moment();
			if (!user.oneTimeCodeExpires || now.diff(user.oneTimeCodeExpires, 'minutes') > 0) {
				user.oneTimeCode = randomize('A', 6);
				user.oneTimeCodeExpires = moment().add(15, 'minutes');
				user.passwordResetTime = Date();
				await user.save();
			}

			if (process.env.NODE_ENV != 'test') {
				console.log('Sending one time code to: ' + email);
				await mailgun.messages.create(config.get('mailgunDomain'), {
					from: 'Utbildarbokning.se <noreply@mail.utbildarbokning.se>',
					to: [email],
					subject: `Din engångskod är ${user.oneTimeCode}`,
					text: `Välkommen till utbildarbokning.se!
        Din engångskod är: ${user.oneTimeCode}
        Tänk på att koden endast gäller i femton minuter efter att den utfärdats
        Vid problem med inloggning kan du skicka ett mail till max.strandberg@gymnastik.se så hjälper jag dig snarast möjligt!`,
					html: `<h1>Välkommen till utbildarbokning.se!</h1>
        <h3>Du kan nu logga med engångskoden: ${user.oneTimeCode}</h3>
        <p>Tänk på att koden endast gäller i femton minuter efter att den utfärdats</p>
        <p>Vid problem med inloggning kan du skicka ett mail till <b>max.strandberg@gymnastik.se</b> så hjälper jag dig snarast möjligt!</p>`,
				});
			} else {
				console.log('Testing one time code, no email sent');
			}
			return res.json({ msg: 'Success!' });
		} catch (error) {
			console.error(error);

			res.status(500).send('Server error');
		}
	}
);

module.exports = router;
