import { GROUPS_LOADING, GROUPS_LOADING_ERROR, GROUPS_LOADED, GROUPACCESS_UPDATE_SUCCESS } from '../actions/types';

const initialState = {
	groups: [],
	loading: true,
};

const groupsReducer = (state = initialState, action) => {
	const { type, payload } = action;

	switch (type) {
		case GROUPS_LOADING:
			return { ...state, loading: true };
		case GROUPS_LOADING_ERROR:
			return { ...state, loading: false };
		case GROUPS_LOADED:
			return { ...state, loading: false, groups: payload };
		case GROUPACCESS_UPDATE_SUCCESS:
			return {
				...state,
				groups: state.groups.map((group) => {
					return group._id === payload._id ? payload : group;
				}),
			};
		default:
			return state;
	}
};

export default groupsReducer;
