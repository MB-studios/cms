process.env.NODE_ENV = 'test';
const User = require('../models/User');
const config = require('config');
const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../server');
const expect = chai.expect;

chai.use(chaiHttp);

describe('Users', () => {
	beforeEach(async () => {
		await User.deleteMany();
	});

	describe('POST /users', () => {
		it('Empty call should return an error', async () => {
			await chai
				.request(server)
				.post('/api/users')
				.then((res) => {
					expect(res).to.have.status(200);
					expect(res).to.be.json;
					expect(res.body).to.have.property('errors');
					expect(res.body.errors.map((e) => e.param)).to.include('name');
					expect(res.body.errors.map((e) => e.param)).to.include('email');
					expect(res.body.errors.map((e) => e.param)).to.include('password');
				});
		});
		it('No name should return an error', async () => {
			await chai
				.request(server)
				.post('/api/users')
				.send({ email: 'test@emailcom', password: 'asdfgh' })
				.then((res) => {
					expect(res).to.have.status(200);
					expect(res).to.be.json;
					expect(res.body).to.have.property('errors');
					expect(res.body.errors.map((e) => e.param)).to.include('name');
				});
		});
		it('No email should return an error', async () => {
			await chai
				.request(server)
				.post('/api/users')
				.send({ name: 'Testnamn', password: 'asdfgh' })
				.then((res) => {
					expect(res).to.have.status(200);
					expect(res).to.be.json;
					expect(res.body).to.have.property('errors');
					expect(res.body.errors.map((e) => e.param)).to.include('email');
				});
		});
		it('No password should return an error', async () => {
			await chai
				.request(server)
				.post('/api/users')
				.send({ name: 'Testnamn', email: 'test@email.com' })
				.then((res) => {
					expect(res).to.have.status(200);
					expect(res).to.be.json;
					expect(res.body).to.have.property('errors');
					expect(res.body.errors.map((e) => e.param)).to.include('password');
				});
		});
		it('Faulty email should return an error', async () => {
			await chai
				.request(server)
				.post('/api/users')
				.send({ name: 'Testnamn', email: 'test@emailcom', password: 'asdfgh' })
				.then((res) => {
					expect(res).to.have.status(200);
					expect(res).to.be.json;
					expect(res.body).to.have.property('errors');
					expect(res.body.errors.map((e) => e.param)).to.include('email');
				});
		});
		it('Too short password should return an error', async () => {
			await chai
				.request(server)
				.post('/api/users')
				.send({ name: 'Testnamn', email: 'test@email.com', password: 'as' })
				.then((res) => {
					expect(res).to.have.status(200);
					expect(res).to.be.json;
					expect(res.body).to.have.property('errors');
					expect(res.body.errors.map((e) => e.param)).to.include('password');
				});
		});
		it('Corrrect data should add a user to the DB', async () => {
			await chai
				.request(server)
				.post('/api/users')
				.send({ name: 'Testnamn', email: 'test@email.com', password: 'asdfgh' })
				.then((res) => {
					expect(res).to.have.status(200);
					expect(res).to.be.json;
					expect(res.body).to.not.have.property('errors');
				});
		});
		it('Adding an existing email should return an error', async () => {
			await new User({
				name: 'Testuser',
				email: 'test@email.com',
				password: '$2a$10$4mgjCcDvdQHZOLLp1ZNhzuzT/Y.Di2bxqw.HHll/586xN6X9EwN9y',
				activated: false,
			}).save();
			await chai
				.request(server)
				.post('/api/users')
				.send({ name: 'Testnamn', email: 'test@email.com', password: 'asdfgh' })
				.then((res) => {
					expect(res).to.have.status(200);
					expect(res).to.be.json;
					expect(res.body).to.have.property('errors');
					expect(res.body.errors.map((e) => e.param)).to.include('email');
				});
		});
		it('Login in the created user should return a token', async () => {
			await new User({
				name: 'Testuser',
				email: 'test@email.com',
				password: '$2a$10$4mgjCcDvdQHZOLLp1ZNhzuzT/Y.Di2bxqw.HHll/586xN6X9EwN9y',
				activated: true,
			}).save();
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
	});
});
