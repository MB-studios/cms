import React from 'react';
import { Link } from 'react-router-dom';
import Jumbotron from 'react-bootstrap/Jumbotron';
import LoginBox from '../auth/LoginBox';

const Landing = () => {
	return (
		<Jumbotron className="mt-3">
			<h1 className="x-large">Login landing</h1>
			<div className="buttons">
				<Link to="/register" className="btn btn-primary">
					Sign Ups
				</Link>
				<Link to="/login" className="btn btn-light">
					Login
				</Link>
			</div>
			<div>
				<LoginBox />
			</div>
		</Jumbotron>
	);
};

export default Landing;
