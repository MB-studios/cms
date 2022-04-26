process.env.NODE_ENV = 'test';
const mongoose = require('mongoose');
const User = require('../models/User');
const Group = require('../models/Group');
const Access = require('../models/Access');
const jwt = require('jsonwebtoken');
const config = require('config');
const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../server');
const { USERS, GROUPS, ACCESS } = require('../client/src/config/accessTypes');
const expect = chai.expect;

describe('Groups', () => {
	let admin;
	let adminToken;
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
	});

	describe('POST /groups', () => {
		it('Creating a group with no token should return an error', async () => {
			await chai
				.request(server)
				.post('/api/groups')
				.send({ name: 'Testgrupp' })
				.then((res) => {
					expect(res).to.have.status(401);
					expect(res).to.be.json;
					expect(res.body).to.have.property('errors');
					expect(res.body.errors.map((e) => e.msg)).to.include('No token, authorization denied');
				});
		});

		it('Creating a group with no name should reurn an error', async () => {
			await chai
				.request(server)
				.post('/api/groups')
				.set('x-auth-token', adminToken)
				.send()
				.then((res) => {
					expect(res).to.have.status(200);
					expect(res).to.be.json;
					expect(res.body).to.have.property('errors');
					expect(res.body.errors.map((e) => e.msg)).to.include('Name is required');
				});
		});

		it('Creating a group with proper name and token should not return an error', async () => {
			await chai
				.request(server)
				.post('/api/groups')
				.set('x-auth-token', adminToken)
				.send({ name: 'Testgrupp' })
				.then((res) => {
					expect(res).to.have.status(200);
					expect(res).to.be.json;
					expect(res.body).to.not.have.property('errors');
					expect(res.body.name).to.equal('Testgrupp');
					expect(res.body.defaultGroup).to.equal(false);
					expect(res.body.users.length).to.equal(0);
					expect(res.body.access.length).to.equal(0);
				});
		});
	});

	describe('GET /groups', () => {
		it('Should return an array with all existing groups', async () => {
			await chai.request(server).post('/api/groups').set('x-auth-token', adminToken).send({ name: 'Testgrupp1' });
			await chai.request(server).post('/api/groups').set('x-auth-token', adminToken).send({ name: 'Testgrupp2' });
			await chai
				.request(server)
				.get('/api/groups')
				.set('x-auth-token', adminToken)
				.then((res) => {
					expect(res).to.have.status(200);
					expect(res).to.be.json;
					expect(res.body).to.not.have.property('errors');
					expect(res.body.length).to.equal(3);
					expect(res.body[0].name).to.equal('Admin');
					expect(res.body[1].name).to.equal('Testgrupp1');
					expect(res.body[2].name).to.equal('Testgrupp2');
				});
		});
	});

	describe('GET /groups/groupID', () => {
		it('Invalid groupId should return an error', async () => {
			await chai
				.request(server)
				.get('/api/groups/asdf')
				.set('x-auth-token', adminToken)
				.then((res) => {
					expect(res).to.have.status(200);
					expect(res).to.be.json;
					expect(res.body).to.have.property('errors');
					expect(res.body.errors.map((e) => e.msg)).to.include('Group not found');
				});
		});

		it('Valid but nonexisting groupId should return an error', async () => {
			await chai
				.request(server)
				.get('/api/groups/' + mongoose.Types.ObjectId())
				.set('x-auth-token', adminToken)
				.then((res) => {
					expect(res).to.have.status(200);
					expect(res).to.be.json;
					expect(res.body).to.have.property('errors');
					expect(res.body.errors.map((e) => e.msg)).to.include('Group not found');
				});
		});

		it('Should return a group with no error', async () => {
			let group1;
			await chai
				.request(server)
				.post('/api/groups')
				.set('x-auth-token', adminToken)
				.send({ name: 'Testgrupp1' })
				.then((res) => {
					group1 = res.body;
				});
			await chai.request(server).post('/api/groups').set('x-auth-token', adminToken).send({ name: 'Testgrupp2' });
			await chai
				.request(server)
				.get('/api/groups/' + group1._id)
				.set('x-auth-token', adminToken)
				.then((res) => {
					expect(res).to.have.status(200);
					expect(res).to.be.json;
					expect(res.body).to.not.have.property('errors');
					expect(res.body.name).to.equal('Testgrupp1');
				});
		});
	});

	describe('POST /groups/user', () => {
		it('No data should return an error', async () => {
			await chai
				.request(server)
				.post('/api/groups/user')
				.set('x-auth-token', adminToken)
				.send()
				.then((res) => {
					expect(res).to.have.status(200);
					expect(res).to.be.json;
					expect(res.body).to.have.property('errors');
					expect(res.body.errors.map((e) => e.msg)).to.include('Group ID is required');
					expect(res.body.errors.map((e) => e.msg)).to.include('User ID is required');
				});
		});
		it('No group should return an error', async () => {
			await chai
				.request(server)
				.post('/api/groups/user')
				.set('x-auth-token', adminToken)
				.send({ user: admin._id })
				.then((res) => {
					expect(res).to.have.status(200);
					expect(res).to.be.json;
					expect(res.body).to.have.property('errors');
					expect(res.body.errors.map((e) => e.msg)).to.include('Group ID is required');
				});
		});
		it('No user should return an error', async () => {
			await chai
				.request(server)
				.post('/api/groups/user')
				.set('x-auth-token', adminToken)
				.send({ group: mongoose.Types.ObjectId() })
				.then((res) => {
					expect(res).to.have.status(200);
					expect(res).to.be.json;
					expect(res.body).to.have.property('errors');
					expect(res.body.errors.map((e) => e.msg)).to.include('User ID is required');
				});
		});
		it('Invalid group should return an error', async () => {
			await chai
				.request(server)
				.post('/api/groups/user')
				.set('x-auth-token', adminToken)
				.send({ group: 'asdf', user: admin._id })
				.then((res) => {
					expect(res).to.have.status(200);
					expect(res).to.be.json;
					expect(res.body).to.have.property('errors');
					expect(res.body.errors.map((e) => e.msg)).to.include('Invalid ObjectID');
				});
		});
		it('Non existing group should return an error', async () => {
			await chai
				.request(server)
				.post('/api/groups/user')
				.set('x-auth-token', adminToken)
				.send({ group: mongoose.Types.ObjectId(), user: admin._id })
				.then((res) => {
					expect(res).to.have.status(200);
					expect(res).to.be.json;
					expect(res.body).to.have.property('errors');
					expect(res.body.errors.map((e) => e.msg)).to.include('Group not found');
				});
		});
		it('Invalid user should return an error', async () => {
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
				.post('/api/groups/user')
				.set('x-auth-token', adminToken)
				.send({ group: groupID, user: 'asdf' })
				.then((res) => {
					expect(res).to.have.status(200);
					expect(res).to.be.json;
					expect(res.body).to.have.property('errors');
					expect(res.body.errors.map((e) => e.msg)).to.include('Invalid ObjectID');
				});
		});
		it('non existing user should return an error', async () => {
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
				.post('/api/groups/user')
				.set('x-auth-token', adminToken)
				.send({ group: groupID, user: mongoose.Types.ObjectId() })
				.then((res) => {
					expect(res).to.have.status(200);
					expect(res).to.be.json;
					expect(res.body).to.have.property('errors');
					expect(res.body.errors.map((e) => e.msg)).to.include('User not found');
				});
		});
		it('Valid group and user should return the group populated with the user', async () => {
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
				.post('/api/groups/user')
				.set('x-auth-token', adminToken)
				.send({ group: groupID, user: admin._id })
				.then((res) => {
					expect(res).to.have.status(200);
					expect(res).to.be.json;
					expect(res.body).to.not.have.property('errors');
					expect(res.body._id).to.equal(groupID);
					expect(res.body.users[0]._id).to.equal(admin._id.toString());
				});
		});
	});

	describe('POST /groups/access', () => {
		it('No data should return an error', async () => {
			await chai
				.request(server)
				.post('/api/groups/access')
				.set('x-auth-token', adminToken)
				.send()
				.then((res) => {
					expect(res).to.have.status(200);
					expect(res).to.be.json;
					expect(res.body).to.have.property('errors');
					expect(res.body.errors.map((e) => e.msg)).to.include('Group ID is required');
					expect(res.body.errors.map((e) => e.msg)).to.include('Type is required');
					expect(res.body.errors.map((e) => e.msg)).to.include('Read is required');
					expect(res.body.errors.map((e) => e.msg)).to.include('Write is required');
				});
		});
		it('Invalid group should return an error', async () => {
			await chai
				.request(server)
				.post('/api/groups/access')
				.set('x-auth-token', adminToken)
				.send({ group: 'asdf', type: 'USER', read: true, write: true })
				.then((res) => {
					expect(res).to.have.status(200);
					expect(res).to.be.json;
					expect(res.body).to.have.property('errors');
					expect(res.body.errors.map((e) => e.msg)).to.include('Group ID is required');
				});
		});
		it('Invalid type should return an error', async () => {
			await chai
				.request(server)
				.post('/api/groups/access')
				.set('x-auth-token', adminToken)
				.send({ group: mongoose.Types.ObjectId(), type: '', read: true, write: true })
				.then((res) => {
					expect(res).to.have.status(200);
					expect(res).to.be.json;
					expect(res.body).to.have.property('errors');
					expect(res.body.errors.map((e) => e.msg)).to.include('Type is required');
				});
		});
		it('Invalid read should return an error', async () => {
			await chai
				.request(server)
				.post('/api/groups/access')
				.set('x-auth-token', adminToken)
				.send({ group: mongoose.Types.ObjectId(), type: 'USER', read: '', write: true })
				.then((res) => {
					expect(res).to.have.status(200);
					expect(res).to.be.json;
					expect(res.body).to.have.property('errors');
					expect(res.body.errors.map((e) => e.msg)).to.include('Read is required');
				});
		});
		it('Invalid write should return an error', async () => {
			await chai
				.request(server)
				.post('/api/groups/access')
				.set('x-auth-token', adminToken)
				.send({ group: mongoose.Types.ObjectId(), type: 'USER', read: true, write: '' })
				.then((res) => {
					expect(res).to.have.status(200);
					expect(res).to.be.json;
					expect(res.body).to.have.property('errors');
					expect(res.body.errors.map((e) => e.msg)).to.include('Write is required');
				});
		});
		it('Non existing group should return an error', async () => {
			await chai
				.request(server)
				.post('/api/groups/access')
				.set('x-auth-token', adminToken)
				.send({ group: mongoose.Types.ObjectId(), type: 'USER', read: true, write: true })
				.then((res) => {
					expect(res).to.have.status(200);
					expect(res).to.be.json;
					expect(res.body).to.have.property('errors');
					expect(res.body.errors.map((e) => e.msg)).to.include('Group not found');
				});
		});
		it('Group with no access should add and return a new access object', async () => {
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
				.send({ group: groupID, type: USERS, read: true, write: false })
				.then((res) => {
					expect(res).to.have.status(200);
					expect(res).to.be.json;
					expect(res.body).to.not.have.property('errors');
					expect(res.body).to.have.property('access');
					expect(res.body.access.length).to.equal(1);
					expect(res.body.access[0].group).to.equal(groupID);
					expect(res.body.access[0].type).to.equal(USERS);
					expect(res.body.access[0].read).to.equal(true);
					expect(res.body.access[0].write).to.equal(false);
				});
		});
		it('Group with access should update and return the access object', async () => {
			let groupID;
			await chai
				.request(server)
				.post('/api/groups')
				.set('x-auth-token', adminToken)
				.send({ name: 'Testgrupp' })
				.then((res) => {
					groupID = res.body._id;
				});
			let accessID;
			await chai
				.request(server)
				.post('/api/groups/access')
				.set('x-auth-token', adminToken)
				.send({ group: groupID, type: USERS, read: true, write: false })
				.then((res) => {
					expect(res).to.have.status(200);
					expect(res).to.be.json;
					expect(res.body).to.not.have.property('errors');
					expect(res.body).to.have.property('access');
					expect(res.body.access.length).to.equal(1);
					expect(res.body.access[0].group).to.equal(groupID);
					expect(res.body.access[0].type).to.equal(USERS);
					expect(res.body.access[0].read).to.equal(true);
					expect(res.body.access[0].write).to.equal(false);
					accessID = res.body._id;
				});
			await chai
				.request(server)
				.post('/api/groups/access')
				.set('x-auth-token', adminToken)
				.send({ group: groupID, type: USERS, read: true, write: true })
				.then((res) => {
					expect(res).to.have.status(200);
					expect(res).to.be.json;
					expect(res.body).to.not.have.property('errors');
					expect(res.body).to.have.property('access');
					expect(res.body.access.length).to.equal(1);
					expect(res.body.access[0].group).to.equal(groupID);
					expect(res.body.access[0].type).to.equal(USERS);
					expect(res.body.access[0].read).to.equal(true);
					expect(res.body.access[0].write).to.equal(true);
				});
		});
	});
});
