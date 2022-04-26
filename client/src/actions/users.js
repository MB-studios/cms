import axios from 'axios';
import { setAlert } from './alert';
import {
	USERS_LOADING,
	USERS_LOADING_ERROR,
	USERS_LOADED,
	USERGROUP_UPDATE,
	USERGROUP_UPDATE_FAIL,
	USERGROUP_UPDATE_SUCCESS,
} from './types';

const setGroupsAsParameters = (users) => {
	users = users.map((user) => {
		user.groups.map((group) => {
			return (user[group._id] = true);
		});
		return user;
	});
	return users;
};

export const loadUsers = () => async (dispatch) => {
	await dispatch({ type: USERS_LOADING });

	try {
		const res = await axios.get('/api/users/all');
		let users = res.data;
		dispatch({ type: USERS_LOADED, payload: setGroupsAsParameters(users) });
	} catch (error) {
		const errors = error.response.data.errors;

		if (errors) {
			errors.forEach((error) => dispatch(setAlert(error.msg, 'danger')));
		}
		dispatch({ type: USERS_LOADING_ERROR });
	}
};

export const setUserGroup =
	({ userId, groupName, setMember }) =>
	async (dispatch) => {
		dispatch({ type: USERGROUP_UPDATE });
		const config = {
			headers: {
				'Content-Type': 'application/json',
			},
		};
		const body = JSON.stringify({ userId, groupName, setMember });

		try {
			const res = await axios.post('/api/groups/setuser', body, config);

			dispatch({ type: USERGROUP_UPDATE_SUCCESS, payload: setGroupsAsParameters([res.data])[0] });
		} catch (error) {
			const errors = error.response.data.errors;

			if (errors) {
				errors.forEach((error) => dispatch(setAlert(error.msg, 'danger')));
			}
			dispatch({ type: USERGROUP_UPDATE_FAIL });
		}
	};
