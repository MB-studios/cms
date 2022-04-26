process.env.NODE_ENV = 'test';
const mongoose = require('mongoose');
const User = require('../models/User');
const Group = require('../models/Group');
const Access = require('../models/Access');
const { checkForAccess } = require('../middleware/auth');
const jwt = require('jsonwebtoken');
const config = require('config');
const { USERS, GROUPS, ACCESS } = require('../client/src/config/accessTypes');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const chaiHttp = require('chai-http');
const server = require('../server');
const expect = chai.expect;

chai.use(chaiAsPromised);
chai.use(chaiHttp);

describe('Access system', () => {
	let admin;
	let adminToken;
	let user;
	beforeEach(async () => {
		await User.deleteMany();
		await Group.deleteMany();
		await Access.deleteMany();
		admin = new User({
			name: 'Admin',
			email: 'admin@email.com',
			password: '$2a$10$4mgjCcDvdQHZOLLp1ZNhzuzT/Y.Di2bxqw.HHll/586xN6X9EwN9y',
			activated: true,
		});
		let group = new Group({ name: 'Admin' });
		let groupAccess = new Access({ group, type: GROUPS, read: true, write: true });
		let accessAccess = new Access({ group, type: ACCESS, read: true, write: true });

		group.access.push(groupAccess);
		group.access.push(accessAccess);
		group.users.push(admin);
		admin.groups.push(group);

		await groupAccess.save();
		await accessAccess.save();
		await group.save();
		await admin.save();

		adminToken = jwt.sign({ user: { id: admin._id } }, config.get('jwtSecret'));

		user = await new User({
			name: 'User',
			email: 'user@email.com',
			password: '$2a$10$4mgjCcDvdQHZOLLp1ZNhzuzT/Y.Di2bxqw.HHll/586xN6X9EwN9y',
			activated: true,
		}).save();
	});

	describe('middleware/auth.checkForAccess(user, access)', () => {
		it('Non existing user should return an error', async () => {
			await expect(checkForAccess({ id: mongoose.Types.ObjectId() }, {})).to.be.rejectedWith(Error, 'User not found');
		});

		it('No groups should return an error', async () => {
			await expect(checkForAccess(user, { type: USERS, read: true, write: true })).to.be.rejectedWith(
				Error,
				'Access not found'
			);
		});

		it('No groups with the right access should return an error', async () => {
			await chai
				.request(server)
				.post('/api/groups')
				.set('x-auth-token', adminToken)
				.send({ name: 'Testgrupp' })
				.then((res) => {
					groupID = res.body._id;
				});
			await chai
				.request(server)
				.post('/api/groups/user')
				.set('x-auth-token', adminToken)
				.send({ group: groupID, user: user._id });
			await expect(checkForAccess(user, { type: USERS, read: true, write: true })).to.be.rejectedWith(
				Error,
				'Access not found'
			);
		});
		it('No read access should return an error', async () => {
			let groupID;
			await chai
				.request(server)
				.post('/api/groups')
				.set('x-auth-token', adminToken)
				.send({ name: 'Testgrupp' })
				.then((res) => {
					groupID = res.body._id;
				});
			await chai
				.request(server)
				.post('/api/groups/access')
				.set('x-auth-token', adminToken)
				.send({ group: groupID, type: USERS, read: false, write: true });
			await chai
				.request(server)
				.post('/api/groups/user')
				.set('x-auth-token', adminToken)
				.send({ group: groupID, user: user._id });
			//console.log(await checkForAccess(user, { type: USERS, read: true, write: true }));
			await expect(checkForAccess(user, { type: USERS, read: true, write: true })).to.be.rejectedWith(
				Error,
				'Read access not found'
			);
		});
		it('No write access should return an error', async () => {
			await chai
				.request(server)
				.post('/api/groups')
				.set('x-auth-token', adminToken)
				.send({ name: 'Testgrupp' })
				.then((res) => {
					groupID = res.body._id;
				});
			await chai
				.request(server)
				.post('/api/groups/access')
				.set('x-auth-token', adminToken)
				.send({ group: groupID, type: 'USERS', read: true, write: false });
			await chai
				.request(server)
				.post('/api/groups/user')
				.set('x-auth-token', adminToken)
				.send({ group: groupID, user: user._id });
			await expect(checkForAccess(user, { type: USERS, read: true, write: true })).to.be.rejectedWith(
				Error,
				'Write access not found'
			);
		});

		it('No read or write access should return an error', async () => {
			await chai
				.request(server)
				.post('/api/groups')
				.set('x-auth-token', adminToken)
				.send({ name: 'Testgrupp' })
				.then((res) => {
					groupID = res.body._id;
				});
			await chai
				.request(server)
				.post('/api/groups/access')
				.set('x-auth-token', adminToken)
				.send({ group: groupID, type: 'USERS', read: false, write: false });
			await chai
				.request(server)
				.post('/api/groups/user')
				.set('x-auth-token', adminToken)
				.send({ group: groupID, user: user._id });
			await expect(checkForAccess(user, { type: USERS, read: true, write: true })).to.be.rejectedWith(
				Error,
				'Read access not found'
			);
		});

		it('Valid read access should return true', async () => {
			await chai
				.request(server)
				.post('/api/groups')
				.set('x-auth-token', adminToken)
				.send({ name: 'Testgrupp' })
				.then((res) => {
					groupID = res.body._id;
				});
			await chai
				.request(server)
				.post('/api/groups/access')
				.set('x-auth-token', adminToken)
				.send({ group: groupID, type: 'USERS', read: true, write: false });
			await chai
				.request(server)
				.post('/api/groups/user')
				.set('x-auth-token', adminToken)
				.send({ group: groupID, user: user._id });
			await expect(await checkForAccess(user, { type: USERS, read: true, write: false })).to.be.true;
		});

		it('Valid write access should return true', async () => {
			await chai
				.request(server)
				.post('/api/groups')
				.set('x-auth-token', adminToken)
				.send({ name: 'Testgrupp' })
				.then((res) => {
					groupID = res.body._id;
				});
			await chai
				.request(server)
				.post('/api/groups/access')
				.set('x-auth-token', adminToken)
				.send({ group: groupID, type: 'USERS', read: false, write: true });
			await chai
				.request(server)
				.post('/api/groups/user')
				.set('x-auth-token', adminToken)
				.send({ group: groupID, user: user._id });
			await expect(await checkForAccess(user, { type: USERS, read: false, write: true })).to.be.true;
		});

		it('Valid read and write access should return true', async () => {
			await chai
				.request(server)
				.post('/api/groups')
				.set('x-auth-token', adminToken)
				.send({ name: 'Testgrupp' })
				.then((res) => {
					groupID = res.body._id;
				});
			await chai
				.request(server)
				.post('/api/groups/access')
				.set('x-auth-token', adminToken)
				.send({ group: groupID, type: 'USERS', read: true, write: true });
			await chai
				.request(server)
				.post('/api/groups/user')
				.set('x-auth-token', adminToken)
				.send({ group: groupID, user: user._id });
			await expect(await checkForAccess(user, { type: USERS, read: true, write: true })).to.be.true;
		});
	});
});
