import React, { Fragment, useState } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { login } from '../../actions/auth';
import Alert from '../layout/Alert';

const LoginLanding = ({ login }) => {
	const [formData, setFormData] = useState({
		email: '',
		password: '',
		code: '',
		logintype: 'password',
	});

	const { email, password } = formData;

	const onChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

	const onLogin = (e) => {
		e.preventDefault();
		login(email, password);
	};

	return (
		<Fragment>
			<div className="container h-25">
				<Alert />
			</div>
			<div className="container h-50">
				<div className="d-flex justify-content-center h-100">
					<div className="user_card">
						<div className="d-flex justify-content-center">
							<div className="brand_logo_container">
								<img src={process.env.PUBLIC_URL + '/login-logo.png'} className="brand_logo" alt="Logo" />
							</div>
						</div>
						<h3 className="title mb-4">Login</h3>
						<form onSubmit={(e) => onLogin(e)}>
							<div className="input-group mb-3">
								<div className="input-group-append">
									<span className="input-group-text">
										<i className="fas fa-user"></i>
									</span>
								</div>
								<input
									type="email"
									name="email"
									className="form-control input_user"
									value={email}
									onChange={(e) => onChange(e)}
									placeholder="Email"
								/>
							</div>
							<div className="input-group mb-2">
								<div className="input-group-append">
									<span className="input-group-text">
										<i className="fas fa-key"></i>
									</span>
								</div>
								<input
									type="password"
									name="password"
									className="form-control input_pass"
									value={password}
									onChange={(e) => onChange(e)}
									placeholder="Lösenord"
									suggested="current-password"
								/>
							</div>
							<div className="d-flex justify-content-center mt-3 login_container">
								<button type="submit" name="button" className="btn login_btn">
									Log in
								</button>
							</div>
						</form>
						<div className="w-100 mt-2 text-center">
							No account? <a href="mailto:max.strandberg@gymnastik.se">Register</a>
						</div>
						<div className="w-100 mt-2 text-center">
							<a href="mailto:max.strandberg@gymnastik.se">Forgot password?</a>
						</div>
					</div>
				</div>
			</div>
			<div className="container h-25"></div>
		</Fragment>
	);
};

LoginLanding.propTypes = {
	login: PropTypes.func.isRequired,
};

export default connect(null, { login })(LoginLanding);
