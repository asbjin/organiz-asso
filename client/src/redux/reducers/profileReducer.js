import {
  GET_PROFILE,
  UPDATE_PROFILE,
  PROFILE_ERROR,
  GET_USER_MESSAGES
} from '../actions/types';

const initialState = {
  profile: null,
  userMessages: [],
  loading: true,
  error: null
};

export default function profileReducer(state = initialState, action) {
  const { type, payload } = action;

  switch (type) {
    case GET_PROFILE:
      return {
        ...state,
        profile: payload,
        loading: false
      };
    case UPDATE_PROFILE:
      return {
        ...state,
        profile: payload,
        loading: false
      };
    case GET_USER_MESSAGES:
      return {
        ...state,
        userMessages: payload,
        loading: false
      };
    case PROFILE_ERROR:
      return {
        ...state,
        error: payload,
        loading: false
      };
    default:
      return state;
  }
} 