import {
  GET_FORUMS,
  GET_FORUM,
  CREATE_FORUM,
  UPDATE_FORUM,
  DELETE_FORUM,
  FORUM_ERROR
} from '../actions/types';

const initialState = {
  forums: [],
  forum: null,
  loading: true,
  error: null
};

export default function forumReducer(state = initialState, action) {
  const { type, payload } = action;

  switch (type) {
    case GET_FORUMS:
      return {
        ...state,
        forums: payload,
        loading: false
      };
    case GET_FORUM:
      return {
        ...state,
        forum: payload,
        loading: false
      };
    case CREATE_FORUM:
      return {
        ...state,
        forums: [payload, ...state.forums],
        loading: false
      };
    case UPDATE_FORUM:
      return {
        ...state,
        forums: state.forums.map(forum => 
          forum._id === payload._id ? payload : forum
        ),
        forum: payload,
        loading: false
      };
    case DELETE_FORUM:
      return {
        ...state,
        forums: state.forums.filter(forum => forum._id !== payload),
        loading: false
      };
    case FORUM_ERROR:
      return {
        ...state,
        error: payload,
        loading: false
      };
    default:
      return state;
  }
} 