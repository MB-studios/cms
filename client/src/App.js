import React, { Fragment, useEffect } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import NavigationBar from './components/layout/NavigationBar';
import Landing from './components/layout/Landing';
import Alert from './components/layout/Alert';
import Register from './components/auth/Register';
import Login from './components/auth/Login';
import LoginLanding from './components/auth/LoginLanding';
import UserTable from './components/tables/UserTable';
import GroupTable from './components/tables/GroupTable';
import store from './store';
import { loadUser } from './actions/auth';
import setAuthToken from './utils/setAuthToken';
import Container from 'react-bootstrap/esm/Container';

if (localStorage.token) {
	setAuthToken(localStorage.token);
}

const App = ({ isAuthenticated, user }) => {
	useEffect(() => {
		store.dispatch(loadUser());
	}, []);
	if (!isAuthenticated) {
		return <LoginLanding />;
	}
	return (
		<Router>
			<Fragment>
				<NavigationBar />

				<Container>
					<Route exact path="/" component={Landing} />
					<Alert />
					<Switch>
						<Route exact path="/register" component={Register} />
						<Route exact path="/login" component={Login} />
						<Route exact path="/users" component={UserTable} />
						<Route exact path="/groups" component={GroupTable} />
					</Switch>
				</Container>
			</Fragment>
		</Router>
	);
};

App.propTypes = {
	isAuthenticated: PropTypes.bool,
	user: PropTypes.object,
};

const mapStateToProps = (state) => ({
	isAuthenticated: state.auth.isAuthenticated,
	user: state.auth.user,
});

export default connect(mapStateToProps)(App);
