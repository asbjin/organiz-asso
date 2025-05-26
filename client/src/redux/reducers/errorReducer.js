import { SET_ERROR, CLEAR_ERROR } from '../actions/types';

const initialState = {
  message: null,
  statusCode: null,
  id: null,
};

export default function errorReducer(state = initialState, action) {
  const { type, payload } = action;

  switch (type) {
    case SET_ERROR:
      return {
        message: payload.message,
        statusCode: payload.statusCode,
        id: payload.id,
      };
    case CLEAR_ERROR:
      return {
        message: null,
        statusCode: null,
        id: null,
      };
    default:
      return state;
  }
} 