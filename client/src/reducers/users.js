import { USERS_LOADING, USERS_LOADING_ERROR, USERS_LOADED, USERGROUP_UPDATE_SUCCESS } from '../actions/types';

const initialState = {
	users: [],
	loading: true,
};

const usersReducer = (state = initialState, action) => {
	const { type, payload } = action;

	switch (type) {
		case USERS_LOADING:
			return { ...state, loading: true };
		case USERS_LOADING_ERROR:
			return { ...state, loading: false };
		case USERS_LOADED:
			return { ...state, loading: false, users: payload };
		case USERGROUP_UPDATE_SUCCESS:
			return {
				...state,
				users: state.users.map((user) => {
					return user._id === payload._id ? payload : user;
				}),
			};
		default:
			return state;
	}
};

export default usersReducer;
