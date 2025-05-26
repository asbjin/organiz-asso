import { combineReducers } from 'redux';
import authReducer from './authReducer';
import forumReducer from './forumReducer';
import profileReducer from './profileReducer';
import messageReducer from './messageReducer';
import errorReducer from './errorReducer';
import loadingReducer from './loadingReducer';

// Combinaison de tous les réducteurs en un seul
const rootReducer = combineReducers({
  auth: authReducer,
  forums: forumReducer,
  profiles: profileReducer,
  messages: messageReducer,
  errors: errorReducer,
  loading: loadingReducer,
});

export default rootReducer; 