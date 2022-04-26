process.env.NODE_ENV = 'test';
const mongoose = require('mongoose');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const config = require('config');
const moment = require('moment');
const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../server');
const { USERS, GROUPS, ACCESS } = require('../client/src/config/accessTypes');
const expect = chai.expect;

chai.use(chaiHttp);

describe('Auth', () => {
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
			name: 'Testuser',
			email: 'test@email.com',
			password: '$2a$10$4mgjCcDvdQHZOLLp1ZNhzuzT/Y.Di2bxqw.HHll/586xN6X9EwN9y',
			activated: true,
		}).save();
	});

	describe('GET /auth', () => {
		it('No token should return an error', async () => {
			await chai
				.request(server)
				.get('/api/auth')
				.then((res) => {
					expect(res).to.have.status(401);
					expect(res).to.be.json;
					expect(res.body).to.have.property('errors');
					expect(res.body.errors.map((e) => e.msg)).to.include('No token, authorization denied');
				});
		});

		it('Invalid token shoud return an error', async () => {
			await chai
				.request(server)
				.get('/api/auth')
				.set('x-auth-token', jwt.sign({ user: { id: mongoose.Types.ObjectId() } }, 'wrongToken'))
				.then((res) => {
					expect(res).to.have.status(401);
					expect(res).to.be.json;
					expect(res.body).to.have.property('errors');
					expect(res.body.errors.map((e) => e.msg)).to.include('Invalid Token');
					expect(res.body).to.not.have.property('_id');
				});
		});

		it('Valid token for non existent user should return error', async () => {
			await chai
				.request(server)
				.get('/api/auth')
				.set('x-auth-token', jwt.sign({ user: { id: mongoose.Types.ObjectId() } }, config.get('jwtSecret')))
				.then((res) => {
					expect(res).to.have.status(200);
					expect(res).to.be.json;
					expect(res.body).to.have.property('errors');
					expect(res.body.errors.map((e) => e.msg)).to.include('Invalid Token');
					expect(res.body).to.not.have.property('_id');
				});
		});

		it('Valid token should return a user', async () => {
			await chai
				.request(server)
				.get('/api/auth')
				.set('x-auth-token', adminToken)
				.then((res) => {
					expect(res).to.have.status(200);
					expect(res).to.be.json;
					expect(res.body).to.not.have.property('errors');
					expect(res.body._id).to.equal(admin.id);
					expect(res.body.name).to.equal(admin.name);
					expect(res.body.email).to.equal(admin.email);
					expect(res.body).to.have.property('groups');
				});
		});
	});

	describe('POST /auth', () => {
		it('No data should return an error message', async () => {
			await chai
				.request(server)
				.post('/api/auth')
				.then((res) => {
					expect(res).to.have.status(200);
					expect(res).to.be.json;
					expect(res.body).to.have.property('errors');
					expect(res.body.errors.map((e) => e.param)).to.include('email');
					expect(res.body.errors.map((e) => e.param)).to.include('password');
					expect(res.body).to.not.have.property('token');
				});
		});
		it('Faulty email should return an error message', async () => {
			await chai
				.request(server)
				.post('/api/auth')
				.send({ email: 'test@emailcom', password: 'asdfgh' })
				.then((res) => {
					expect(res).to.have.status(200);
					expect(res).to.be.json;
					expect(res.body).to.have.property('errors');
					expect(res.body.errors.map((e) => e.param)).to.include('email');
					expect(res.body.errors.map((e) => e.param)).to.not.include('password');
					expect(res.body).to.not.have.property('token');
				});
		});
		it('Non existant email should return an error message', async () => {
			await chai
				.request(server)
				.post('/api/auth')
				.send({ email: 'nonexistant@email.com', password: 'asdfgh' })
				.then((res) => {
					expect(res).to.have.status(200);
					expect(res).to.be.json;
					expect(res.body).to.have.property('errors');
					expect(res.body.errors.map((e) => e.msg)).to.include('Invalid Credentials');
					expect(res.body).to.not.have.property('token');
				});
		});
		it('Existant email, wrong password should return an error message', async () => {
			await chai
				.request(server)
				.post('/api/auth')
				.send({ email: 'test@email.com', password: 'wrong' })
				.then((res) => {
					expect(res).to.have.status(200);
					expect(res).to.be.json;
					expect(res.body).to.have.property('errors');
					expect(res.body.errors.map((e) => e.msg)).to.include('Invalid Credentials');
					expect(res.body).to.not.have.property('token');
				});
		});
		it('Non activated account should return an error message', async () => {
			user.activated = false;
			user.save();
			await chai
				.request(server)
				.post('/api/auth')
				.send({ email: 'test@email.com', password: 'asdfgh' })
				.then((res) => {
					expect(res).to.have.status(200);
					expect(res).to.be.json;
					expect(res.body).to.have.property('errors');
					expect(res.body.errors.map((e) => e.msg)).to.include('Account not activated');
					expect(res.body).to.not.have.property('token');
				});
		});
		it('Existant email, correct password should return a json web token', async () => {
			await chai
				.request(server)
				.post('/api/auth')
				.send({ email: 'test@email.com', password: 'asdfgh' })
				.then((res) => {
					expect(res).to.have.status(200);
					expect(res).to.be.json;
					expect(res.body).to.not.have.property('errors');
					expect(res.body).to.have.property('token');
				});
		});
		it('Expired one time code should return an error message', async () => {
			user.oneTimeCode = 'oneTimeCode';
			user.oneTimeCodeExpires = '2000-01-01T12:00:00.000+00:00';
			user.save();
			await chai
				.request(server)
				.post('/api/auth')
				.send({ email: 'test@email.com', password: 'oneTimeCode' })
				.then((res) => {
					expect(res).to.have.status(200);
					expect(res).to.be.json;
					expect(res.body).to.have.property('errors');
					expect(res.body.errors.map((e) => e.msg)).to.include('Code Expired');
					expect(res.body).to.not.have.property('token');
				});
		});
		it('Valid one time code should return a json web token', async () => {
			user.oneTimeCode = 'oneTimeCode';
			user.oneTimeCodeExpires = '2100-01-01T12:00:00.000+00:00';
			user.save();
			await chai
				.request(server)
				.post('/api/auth')
				.send({ email: 'test@email.com', password: 'oneTimeCode' })
				.then((res) => {
					expect(res).to.have.status(200);
					expect(res).to.be.json;
					expect(res.body).to.not.have.property('errors');
					expect(res.body).to.have.property('token');
					var decoded = jwt.verify(res.body.token, config.get('jwtSecret'));
					expect(moment().add(config.get('oneTimeCodeExpires'), 's').isAfter(moment.unix(decoded.exp))).to.be.true;
					expect(moment().isBefore(moment.unix(decoded.exp))).to.be.true;
				});
		});
	});

	describe('POST /auth/getonetimecode', () => {
		it('No data should return a new one time code without any errors', async () => {
			await chai
				.request(server)
				.post('/api/auth/getonetimecode')
				.send()
				.then((res) => {
					expect(res).to.have.status(200);
					expect(res).to.be.json;
					expect(res.body).to.have.property('errors');
					expect(res.body.errors.map((e) => e.msg)).to.include('Please include a vaild email');
				});
		});

		it('Faulty email should return a new one time code without any errors', async () => {
			await chai
				.request(server)
				.post('/api/auth/getonetimecode')
				.send({ email: 'test@emailcom' })
				.then((res) => {
					expect(res).to.have.status(200);
					expect(res).to.be.json;
					expect(res.body).to.have.property('errors');
					expect(res.body.errors.map((e) => e.msg)).to.include('Please include a vaild email');
				});
		});

		it('Request should return a new one time code without any errors', async () => {
			await chai
				.request(server)
				.post('/api/auth/getonetimecode')
				.send({ email: 'test@email.com' })
				.then((res) => {
					expect(res).to.have.status(200);
					expect(res).to.be.json;
					expect(res.body).to.not.have.property('errors');
				});
		});

		it('Only first login with one time code should work', async () => {
			user.oneTimeCode = 'oneTimeCode';
			user.oneTimeCodeExpires = '2100-01-01T12:00:00.000+00:00';
			user.save();

			await chai
				.request(server)
				.post('/api/auth')
				.send({ email: 'test@email.com', password: 'oneTimeCode' })
				.then((res) => {
					expect(res).to.have.status(200);
					expect(res).to.be.json;
					expect(res.body).to.not.have.property('errors');
					expect(res.body).to.have.property('token');
				});
			await chai
				.request(server)
				.post('/api/auth')
				.send({ email: 'test@email.com', password: 'oneTimeCode' })
				.then((res) => {
					expect(res).to.have.status(200);
					expect(res).to.be.json;
					expect(res.body).to.have.property('errors');
					expect(res.body.errors.map((e) => e.msg)).to.include('Invalid Credentials');
					expect(res.body).to.not.have.property('token');
				});
		});

		it('Requesting a new one time code before the last one expired should return the same code', async () => {
			user.oneTimeCode = 'oneTimeCode';
			user.oneTimeCodeExpires = '2100-01-01T12:00:00.000+00:00';
			user.save();
			await chai
				.request(server)
				.post('/api/auth/getonetimecode')
				.send({ email: 'test@email.com' })
				.then((res) => {
					expect(res).to.have.status(200);
					expect(res).to.be.json;
					expect(res.body).to.not.have.property('errors');
				});
			let u = await User.findOne({ email: 'test@email.com' });
			expect(u.oneTimeCode).to.equal('oneTimeCode');
		});

		it('Requesting a new one time code after the last one expired should return a new code', async () => {
			user.oneTimeCode = 'oneTimeCode';
			user.oneTimeCodeExpires = '2000-01-01T12:00:00.000+00:00';
			user.save();
			await chai
				.request(server)
				.post('/api/auth/getonetimecode')
				.send({ email: 'test@email.com' })
				.then((res) => {
					expect(res).to.have.status(200);
					expect(res).to.be.json;
					expect(res.body).to.not.have.property('errors');
				});
			let u = await User.findOne({ email: 'test@email.com' });
			expect(u.oneTimeCode).to.not.equal('oneTimeCode');
		});
	});
});
