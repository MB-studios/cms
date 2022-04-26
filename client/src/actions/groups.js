import axios from 'axios';
import { setAlert } from './alert';
import {
	GROUPS_LOADING,
	GROUPS_LOADING_ERROR,
	GROUPS_LOADED,
	GROUPACCESS_UPDATE,
	GROUPACCESS_UPDATE_FAIL,
	GROUPACCESS_UPDATE_SUCCESS,
} from './types';

export const loadGroups = () => async (dispatch) => {
	dispatch({ type: GROUPS_LOADING });

	try {
		const res = await axios.get('/api/groups');
		dispatch({ type: GROUPS_LOADED, payload: res.data });
	} catch (error) {
		const errors = error.response.data.errors;

		if (errors) {
			errors.forEach((error) => dispatch(setAlert(error.msg, 'danger')));
		}
		dispatch({ type: GROUPS_LOADING_ERROR });
	}
};

export const setGroupAccess = (parameters) => async (dispatch) => {
	dispatch({ type: GROUPACCESS_UPDATE });
	const config = {
		headers: {
			'Content-Type': 'application/json',
		},
	};
	const body = JSON.stringify(parameters);

	try {
		const res = await axios.post('/api/groups/access', body, config);
		dispatch({ type: GROUPACCESS_UPDATE_SUCCESS, payload: res.data });
	} catch (error) {
		const errors = error.response.data.errors;

		if (errors) {
			errors.forEach((error) => dispatch(setAlert(error.msg, 'danger')));
		}
		dispatch({ type: GROUPACCESS_UPDATE_FAIL });
	}
};
