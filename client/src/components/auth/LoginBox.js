import React, { Fragment, useState } from 'react';
import { Link } from 'react-router-dom';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import { login } from '../../actions/auth';

const LoginBox = ({ login, isAuthenticated }) => {
	const [formData, setFormData] = useState({
		email: '',
		password: '',
	});
	const { email, password } = formData;
	const onChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

	const onSubmit = async (e) => {
		e.preventDefault();
		login(email, password);
	};

	const [show, setShow] = useState(true);

	const handleClose = () => setShow(false);
	const handleShow = () => setShow(true);

	if (isAuthenticated) {
		return '';
	}

	return (
		<Fragment>
			<Modal show={show} onHide={handleClose}>
				<Modal.Header closeButton>
					<Modal.Title>Modal heading</Modal.Title>
				</Modal.Header>
				<Modal.Body>Woohoo, you're reading this text in a modal!</Modal.Body>
				<Modal.Footer>
					<Button variant="secondary" onClick={handleClose}>
						Close
					</Button>
					<Button variant="primary" onClick={handleClose}>
						Save Changes
					</Button>
				</Modal.Footer>
			</Modal>
			<div className="login d-flex align-items-center py-5">
				<div className="container">
					<div className="row">
						<div className="col-md-9 col-lg-8 mx-auto">
							<h3 className="login-heading mb-4">Welcome back!</h3>
							<form>
								<div className="form-floating mb-3">
									<input type="email" className="form-control" id="floatingInput" placeholder="name@example.com" />
									<label htmlFor="floatingInput">Email address</label>
								</div>
								<div className="form-floating mb-3">
									<input type="password" className="form-control" id="floatingPassword" placeholder="Password" />
									<label htmlFor="floatingPassword">Password</label>
								</div>

								<div className="d-grid">
									<button className="btn btn-lg btn-primary btn-login text-uppercase fw-bold mb-2" type="submit">
										Sign in
									</button>
									<div className="text-center">
										<a className="small" href="#">
											Forgot password?
										</a>
									</div>
								</div>
							</form>
						</div>
					</div>
				</div>
			</div>
		</Fragment>
	);
};

LoginBox.propTypes = { login: PropTypes.func.isRequired, isAuthenticated: PropTypes.bool };

const mapStateToProps = (state) => ({
	isAuthenticated: state.auth.isAuthenticated,
});

export default connect(mapStateToProps, { login })(LoginBox);
