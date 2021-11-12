const express = require('express');

const router = express.Router();

const bcrypt = require('bcryptjs');

const jwt = require('jsonwebtoken');

const config = require('config');

const { check, validationResult } = require('express-validator');

const { v4: uuidv4, validate: uuidValidate } = require('uuid');

var moment = require('moment');

const { USERS } = require('../../config/accessTypes');
const auth = require('../../middleware/auth');
const User = require('../../models/User');
const Group = require('../../models/Group');
const Access = require('../../models/Access');

// @route   POST api/users

// @desc    Register user

// @access  Public

router.post(
  '/',

  [
    check('name', 'Name is required').not().isEmpty(),

    check('email', 'Please include a vaild email').isEmail(),

    check(
      'password',

      'Please enter a password with 6 or more characters'
    ).isLength({ min: 6 }),
  ],

  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    var { name, email, password } = req.body;

    email = email.toLowerCase();

    try {
      let user = await User.findOne({ email });

      if (user) {
        return res

          .status(400)

          .json({ errors: [{ msg: 'User already exists' }] });
      }

      user = new User({
        name,

        email,

        password,
        hasPassword: true,

        activated: !config.get('activationRequired'),
      });

      const salt = await bcrypt.genSalt(10);

      user.password = await bcrypt.hash(password, salt);

      await user.save();

      // TODO Kod för att skicka ut aktiveringskod med email ska in här

      res.json({ msg: 'Success!' });
    } catch (error) {
      console.error(error);

      res.status(500).send('Server error');
    }
  }
);

// @route   POST api/users/changepassword

// @desc    Change users password

// @access  Private

router.post(
  '/changepassword',

  [
    check('oldPassword', 'Current password is required').not().isEmpty(),

    check(
      'newPassword',

      'Please enter a password with 6 or more characters'
    ).isLength({ min: 6 }),
  ],

  auth({ type: USERS, read: false, write: false }),

  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { oldPassword, newPassword } = req.body;

    try {
      const user = await User.findById(req.user.id);

      const isMatch = await bcrypt.compare(oldPassword, user.password);

      if (!isMatch) {
        return res

          .status(400)

          .json({ errors: [{ msg: 'Invalid Credentials' }] });
      }

      const salt = await bcrypt.genSalt(10);

      user.password = await bcrypt.hash(newPassword, salt);

      await user.save();

      const payload = {
        user: {
          id: user.id,
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

// @route   POST api/users/activate

// @desc    Activate user with code sent by email

// @access  Public

router.post(
  '/activate',

  [check('activationCode', 'Invalid code').not().isEmpty()],

  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { activationCode } = req.body;

    if (!uuidValidate(activationCode)) {
      return res.status(400).json({ errors: [{ msg: 'Invalid code' }] });
    }

    try {
      const user = await User.findOne({ activationCode });

      if (!user) {
        return res.status(400).json({ errors: [{ msg: 'Invalid code' }] });
      }

      user.activated = true;

      user.activationCode = null;

      await user.save();

      res.json({ msg: 'Success!' });
    } catch (error) {
      console.error(error);

      res.status(500).send('Server error');
    }
  }
);

// @route   POST api/users/forgotpassword

// @desc    Request code to reset password

// @access  Public

router.post(
  '/forgotpassword',

  [check('email', 'Please include a vaild email').isEmail()],

  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;

    try {
      const user = await User.findOne({ email });

      if (!user) {
        return res.json({ msg: 'Success!' });
      }

      user.passwordResetCode = uuidv4();

      user.passwordResetTime = moment().add(1, 'h');

      await user.save();

      // TODO Kod för att skicka ut aktiveringskod med email ska in här

      res.json({ msg: 'Success!' });
    } catch (error) {
      console.error(error);

      res.status(500).send('Server error');
    }
  }
);

// @route   POST api/users/forgotpassword

// @desc    Reset password with code from email

// @access  Public

router.post(
  '/resetpassword',

  [
    check('passwordResetCode', 'Invalid code').not().isEmpty(),

    check(
      'password',

      'Please enter a password with 6 or more characters'
    ).isLength({ min: 6 }),
  ],

  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { passwordResetCode, password } = req.body;

    if (!uuidValidate(passwordResetCode)) {
      return res.status(400).json({ errors: [{ msg: 'Invalid code' }] });
    }

    try {
      const user = await User.findOne({ passwordResetCode });

      if (!user) {
        return res.status(400).json({ errors: [{ msg: 'Invalid code' }] });
      }

      if (moment().isAfter(user.passwordResetTime)) {
        return res

          .status(400)

          .json({ errors: [{ msg: 'Code is no longer valid' }] });
      }

      const salt = await bcrypt.genSalt(10);

      user.password = await bcrypt.hash(password, salt);

      user.passwordResetTime = null;

      user.passwordResetCode = null;

      await user.save();

      res.json({ msg: 'Success!' });
    } catch (error) {
      console.error(error);

      res.status(500).send('Server error');
    }
  }
);

// @route   POST api/users/updateprofile

// @desc    Update name and password of logged in profile

// @access  Private

router.post(
  '/updateprofile',

  [
    auth(),
    [
      check('name', 'Name is required').not().isEmpty(),
      check(
        'password',

        'Please enter a password with 6 or more characters'
      ).isLength({ min: 6 }),
    ],
  ],

  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, password } = req.body;

    try {
      const user = await User.findById(req.user.id);

      if (!user) {
        return res.status(400).json({ errors: [{ msg: 'No such user' }] });
      }

      user.name = name;
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);

      await user.save();

      res.json({ msg: 'Success!' });
    } catch (error) {
      console.error(error);

      res.status(500).send('Server error');
    }
  }
);

// @route   GET api/users/all

// @desc    Get all users

// @access  Private

router.get(
  '/all',

  auth({ type: USERS, read: false, write: false }),

  async (req, res) => {
    try {
      const users = await User.find().select('id name email').sort('name');

      res.json(users);
    } catch (error) {
      console.error(error);

      res.status(500).send('Server error');
    }
  }
);

module.exports = router;
