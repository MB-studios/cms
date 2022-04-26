import { combineReducers } from 'redux';
import alert from './alert';
import auth from './auth';
import users from './users';
import groups from './groups';

export default combineReducers({ alert, auth, users, groups });
