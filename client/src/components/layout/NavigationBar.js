import React from 'react';
import { LinkContainer } from 'react-router-bootstrap';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { logout } from '../../actions/auth';

import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Navbar from 'react-bootstrap/Navbar';
import Nav from 'react-bootstrap/Nav';
import NavDropdown from 'react-bootstrap/NavDropdown';
import Container from 'react-bootstrap/Container';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';

const NavigationBar = ({ auth: { isAuthenticated, loading }, logout }) => {
	const authLinks = (
		<Nav>
			<LinkContainer to="/users">
				<Nav.Link>Användare</Nav.Link>
			</LinkContainer>
			<LinkContainer to="/groups">
				<Nav.Link>Grupper</Nav.Link>
			</LinkContainer>
			<LinkContainer to="/#!">
				<Nav.Link onClick={logout}>Logout</Nav.Link>
			</LinkContainer>
		</Nav>
	);
	const guestLinks = (
		<Nav>
			<LinkContainer to="/register">
				<Nav.Link>Register</Nav.Link>
			</LinkContainer>
			<LinkContainer to="/login">
				<Nav.Link>Login</Nav.Link>
			</LinkContainer>
		</Nav>
	);

	return (
		<Navbar bg="dark" variant="dark">
			<Container>
				<LinkContainer to="/">
					<Navbar.Brand className="font-weight-bold">Login module</Navbar.Brand>
				</LinkContainer>
				<Navbar.Toggle aria-controls="responsive-navbar-nav" />
				<Navbar.Collapse id="responsive-navbar-nav">
					<Nav className="mr-auto"></Nav>
					{!loading && isAuthenticated ? authLinks : guestLinks}
				</Navbar.Collapse>
			</Container>
		</Navbar>
	);
};

NavigationBar.propTypes = {
	logout: PropTypes.func.isRequired,
	auth: PropTypes.object.isRequired,
};

const mapStateToProps = (state) => ({
	auth: state.auth,
});

export default connect(mapStateToProps, { logout })(NavigationBar);
