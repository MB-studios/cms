const jwt = require('jsonwebtoken');
const config = require('config');
const User = require('../models/User');
const Group = require('../models/Group');

async function checkForAccess(user, access) {
	var u = await User.findById(user.id).populate({
		path: 'groups',
		populate: {
			path: 'access',
		},
	});

	if (!u) {
		throw new Error('User not found');
	}
	if (u.groups.length === 0) {
		throw new Error('Access not found');
	}

	u.groups.map((group) => {
		if (
			group.access.filter((a) => {
				return a.type === access.type;
			}).length == 0
		) {
			throw new Error('Access not found');
		}
		if (
			group.access.filter((a) => {
				return a.type === access.type && (!access.read || a.read);
			}).length == 0
		) {
			throw new Error('Read access not found');
		}

		if (
			group.access.filter((a) => {
				return a.type === access.type && (!access.write || a.write);
			}).length == 0
		) {
			throw new Error('Write access not found');
		}
	});

	return true;
}

function auth(access) {
	//console.log(access);
	return async function (req, res, next) {
		const token = req.header('x-auth-token');
		if (!token) {
			return res.status(401).json({ errors: [{ msg: 'No token, authorization denied' }] });
		}

		try {
			const decoded = jwt.verify(token, config.get('jwtSecret'));
			if (decoded.user && access) {
				await checkForAccess(decoded.user, access);
			}

			req.user = decoded.user;
			//console.log(req.user.groups[0]);
			next();
		} catch (error) {
			if (error.name === 'no_access') {
				return res.status(401).json({ errors: [error] });
			}
			return res.status(401).json({ errors: [{ msg: 'Invalid Token' }] });
		}
	};
}

module.exports = {
	checkForAccess,
	auth,
};
