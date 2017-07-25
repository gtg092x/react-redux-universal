import { createStore, combineReducers, applyMiddleware } from 'redux';
import { reducer as universal } from '../../../src';
import { createLogger } from 'redux-logger';

export default function createAppStore(state) {
  const reducer = combineReducers({
    universal
  });
  return createStore(reducer, state, applyMiddleware(createLogger()));
}
