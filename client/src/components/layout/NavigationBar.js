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
      <LinkContainer to='/#!'>
        <Nav.Link onClick={logout}>Logout</Nav.Link>
      </LinkContainer>
    </Nav>
  );
  const guestLinks = (
    <Nav>
      <LinkContainer to='/register'>
        <Nav.Link>Register</Nav.Link>
      </LinkContainer>
      <LinkContainer to='/login'>
        <Nav.Link>Login</Nav.Link>
      </LinkContainer>
      <NavDropdown alignRight title='Login' id='nav-login-dropdown'>
        <div id='login-dp'>
          <Row>
            <Col md='12'>
              <Form>
                <Form.Group>
                  <Form.Control
                    type='email'
                    placeholder='Email adress'
                  ></Form.Control>
                </Form.Group>
                <Form.Group>
                  <Form.Control
                    type='password'
                    placeholder='Password'
                  ></Form.Control>
                  <Form.Text className='help-block text-right'>
                    <LinkContainer to='/forgotpassword'>
                      <Nav.Link className='text-success'>
                        Forgot the password?
                      </Nav.Link>
                    </LinkContainer>
                  </Form.Text>
                </Form.Group>
                <Form.Group>
                  <Button block>Login</Button>
                </Form.Group>
                <Form.Group>
                  <Form.Check type='checkbox' label='keep me logged-in' />
                </Form.Group>
              </Form>
            </Col>
          </Row>
          <Row className='bottom'>
            <Col md='12'>
              <LinkContainer to='/register'>
                <Nav.Link className='text-success'>New here ? Join us</Nav.Link>
              </LinkContainer>
            </Col>
          </Row>
        </div>
      </NavDropdown>
    </Nav>
  );

  return (
    <Navbar bg='dark' variant='dark'>
      <Container>
        <LinkContainer to='/'>
          <Navbar.Brand className='font-weight-bold text-muted'>
            Login module
          </Navbar.Brand>
        </LinkContainer>
        <Navbar.Toggle aria-controls='responsive-navbar-nav' />
        <Navbar.Collapse id='responsive-navbar-nav'>
          <Nav className='mr-auto'></Nav>
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
