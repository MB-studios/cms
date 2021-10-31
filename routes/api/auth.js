const express = require('express');

const router = express.Router();

const bcrypt = require('bcryptjs');

const auth = require('../../middleware/auth');

const { USERS } = require('../../config/accessTypes');

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

  auth({ type: USERS, read: false, write: false }),

  async (req, res) => {
    try {
      const user = await User.findById(req.user.id)

        .select('id name email')

        .populate({
          path: 'groups',

          select: 'id name access',

          populate: { path: 'access', select: 'id type read write' },
        });

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

  [
    check('email', 'Please include a vaild email').isEmail(),

    check('password', 'Password is required').exists(),
  ],

  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    var { email, password } = req.body;

    email = email.toLowerCase();

    try {
      //let user = await User.findOne({ email });

      const user = await User.findOne({ email })

        .select('id name email password activated')

        .populate({
          path: 'groups',

          select: 'id name access',

          populate: { path: 'access', select: 'id type read write' },
        });

      if (!user) {
        return res

          .status(400)

          .json({ errors: [{ msg: 'Invalid Credentials' }] });
      }

      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return res

          .status(400)

          .json({ errors: [{ msg: 'Invalid Credentials' }] });
      }

      if (!user.activated) {
        return res

          .status(400)

          .json({ errors: [{ msg: 'Account not activated' }] });
      }

      const payload = {
        user: {
          id: user.id,

          name: user.name,

          groups: user.groups,
        },
      };

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
      return res.status(400).json({ errors: errors.array() });
    }

    var { email } = req.body;

    email = email.toLowerCase();

    try {
      const user = await User.findOne({ email });

      if (!user) {
        // TODO lägg till användare som inte finns
        return res

          .status(400)

          .json({ errors: [{ msg: 'Invalid Credentials' }] });
      }

      var now = moment();
      if (
        !user.oneTimeCodeExpires ||
        now.diff(user.oneTimeCodeExpires, 'minutes') > 0
      ) {
        user.oneTimeCode = randomize('A', 6);
        user.oneTimeCodeExpires = moment().add(15, 'minutes');
        await user.save();
      }

      await mailgun.messages.create(
        'sandbox2b4d7b4af10f4df3ba8810c28f9a7ca1.mailgun.org',
        {
          from: 'Excited User <mailgun@sandbox-123.mailgun.org>',
          to: ['max.strandberg@gmail.com'],
          subject: 'Hello',
          text: 'Asd!',
          html: `<h1>${user.oneTimeCode}</h1>`,
        }
      );
      return res.json({ msg: 'Success!' });
    } catch (error) {
      console.error(error);

      res.status(500).send('Server error');
    }
  }
);

// @route   POST api/auth/onetimecode
// @desc    Authenticate user and get token
// @access  Public

router.post(
  '/onetimecode',

  [
    check('email', 'Please include a vaild email').isEmail(),

    check('code', 'Code is required').exists(),
  ],

  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    var { email, code } = req.body;

    email = email.toLowerCase();

    try {
      const user = await User.findOne({ email }).populate({
        path: 'groups',
        select: 'id name access',
        populate: { path: 'access', select: 'id type read write' },
      });

      if (!user) {
        return res
          .status(400)
          .json({ errors: [{ msg: 'Invalid Credentials' }] });
      }

      const isMatch = user.oneTimeCode && user.oneTimeCode === code;

      if (!isMatch) {
        return res

          .status(400)

          .json({ errors: [{ msg: 'Invalid Credentials' }] });
      }

      user.oneTimeCode = undefined;
      user.oneTimeCodeExpires = undefined;
      await user.save();

      const payload = {
        user: {
          id: user.id,

          name: user.name,

          groups: user.groups,
        },
      };

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

module.exports = router;
