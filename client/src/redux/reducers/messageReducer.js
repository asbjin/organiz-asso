import {
  GET_MESSAGES,
  GET_MESSAGE,
  CREATE_MESSAGE,
  REPLY_TO_MESSAGE,
  UPDATE_MESSAGE,
  DELETE_MESSAGE,
  MESSAGE_ERROR,
  SEARCH_MESSAGES
} from '../actions/types';

const initialState = {
  messages: [],
  message: null,
  searchResults: [],
  loading: true,
  error: null
};

export default function messageReducer(state = initialState, action) {
  const { type, payload } = action;

  switch (type) {
    case GET_MESSAGES:
      return {
        ...state,
        messages: payload,
        loading: false
      };
    case GET_MESSAGE:
      return {
        ...state,
        message: payload,
        loading: false
      };
    case CREATE_MESSAGE:
      return {
        ...state,
        messages: [payload, ...state.messages],
        loading: false
      };
    case REPLY_TO_MESSAGE:
      return {
        ...state,
        message: {
          ...state.message,
          replies: [...state.message.replies, payload]
        },
        loading: false
      };
    case UPDATE_MESSAGE:
      return {
        ...state,
        messages: state.messages.map(message => 
          message._id === payload._id ? payload : message
        ),
        message: state.message?._id === payload._id ? payload : state.message,
        loading: false
      };
    case DELETE_MESSAGE:
      return {
        ...state,
        messages: state.messages.filter(message => message._id !== payload),
        loading: false
      };
    case SEARCH_MESSAGES:
      return {
        ...state,
        messages: payload,
        searchResults: payload,
        loading: false
      };
    case MESSAGE_ERROR:
      return {
        ...state,
        error: payload,
        loading: false
      };
    default:
      return state;
  }
} 