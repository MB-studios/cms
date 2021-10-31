const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { check, validationResult } = require('express-validator');

const { GROUPS } = require('../../config/accessTypes');
const auth = require('../../middleware/auth');
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
      return res.status(400).json({ errors: errors.array() });
    }

    const { name } = req.body;

    try {
      let group = Group({ name });

      await group.save();

      res.json(group);
    } catch (error) {
      console.error(error);
      res.status(500).send('Server error');
    }
  }
);

// @route   GET api/groups
// @desc    Get all groups
// @access  Private
router.get(
  '/',
  auth({ type: GROUPS, read: true, write: false }),
  async (req, res) => {
    try {
      const groups = await Group.find().populate('access');
      res.json(groups);
    } catch (error) {
      console.log(err.message);
      res.status(500).send('Server Error');
    }
  }
);

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
        return res.status(400).json({ msg: 'Group not found' });
      }

      res.json(group);
    } catch (error) {
      console.error(error.message);
      if (error.kind == 'ObjectId') {
        return res.status(400).json({ msg: 'Group not found' });
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
    [
      check('group', 'Group ID is required').not().isEmpty(),
      check('user', 'User ID is required').not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
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
        return res.status(400).json({ errors: [{ msg: 'Group not found' }] });
      }

      let user = await User.findOne({
        _id: inputFields.user,
      });

      if (!user) {
        return res.status(400).json({ errors: [{ msg: 'User not found' }] });
      }

      group.users.push(user);
      await group.save();

      user.groups.push(group);
      await user.save();

      res.json(group);
    } catch (error) {
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
    auth({ type: GROUPS, read: true, write: true }),
    [
      check('group', 'Group ID is required').not().isEmpty(),
      check('type', 'Type is required').not().isEmpty(),
      check('read', 'Read is required').not().isEmpty(),
      check('write', 'Write is required').not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { group, type, read, write } = req.body;

    const inputFields = {};
    inputFields.group = group;
    inputFields.type = type;
    inputFields.read = read;
    inputFields.write = write;

    try {
      let group = await Group.findOne({
        _id: inputFields.group,
      }).populate('access');

      if (!group) {
        return res.status(400).json({ errors: [{ msg: 'Group not found' }] });
      }

      var access = group.access.find((a) => a.type === inputFields.type);

      if (access) {
        console.log('Uppdate access');
        await Access.findOneAndUpdate({ _id: access._id }, inputFields);
      } else {
        access = new Access(inputFields);
        await access.save();
        group.access.push(access);
        await group.save();
      }

      res.json(access);
    } catch (error) {
      console.error(error.message);
      res.status(500).send('Server error');
    }
  }
);

module.exports = router;
