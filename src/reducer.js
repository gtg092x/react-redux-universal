import { omit } from './util';
const RESULT = '@react-universal/RESULT';
const REQUEST = '@react-universal/REQUEST';
const ERROR = '@react-universal/ERROR';
const CLEAR = '@react-universal/CLEAR';
const CLEAR_ALL = '@react-universal/CLEAR_ALL';

export default function (state = {}, action = {}) {
  switch (action.type) {
    case RESULT:
      return {
        ...state,
        [action.key]: {
          ...(state[action.key] || {}),
          [action.hash]: {
            result: action.data,
          }
        },
      };
    case REQUEST:
      return {
        ...state,
        [action.key]: {
          ...(state[action.key] || {}),
          [action.hash]: {
            request: true,
          }
        },
      };
    case CLEAR:
      return {
        ...state,
        [action.key]: omit(state[action.key], action.hash),
      };
    case CLEAR_ALL:
      return {};
    case ERROR:
      return {
        ...state,
        [action.key]: {
          ...(state[action.key] || {}),
          [action.hash]: {
            error: action.error,
          }
        },
      };
    default:
      return state;
  }
}

export const setResult = (key, hash, data) => ({
  type: RESULT,
  key,
  hash,
  data,
});

export const setRequest = (key, hash) => ({
  type: REQUEST,
  hash,
  key,
});

export const setError = (key, hash, error) => ({
  type: ERROR,
  key,
  hash,
  error,
});

export const clear = (key, hash) => ({
  type: CLEAR,
  hash,
  key,
});

export const clearAll = () => ({
  type: CLEAR_ALL,
});
