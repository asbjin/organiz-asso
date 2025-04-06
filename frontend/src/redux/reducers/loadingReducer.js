import { SET_LOADING, CLEAR_LOADING } from '../actions/types';

const initialState = {
  isLoading: false,
  target: null,
};

export default function loadingReducer(state = initialState, action) {
  const { type, payload } = action;

  switch (type) {
    case SET_LOADING:
      return {
        isLoading: true,
        target: payload,
      };
    case CLEAR_LOADING:
      return {
        isLoading: false,
        target: null,
      };
    default:
      return state;
  }
} 