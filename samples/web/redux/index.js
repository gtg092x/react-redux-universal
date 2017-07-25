import { createStore, combineReducers, applyMiddleware } from 'redux';
import { reducer as iso } from '../../../src';
import { createLogger } from 'redux-logger';

export default function createAppStore(state) {
  const reducer = combineReducers({
    iso
  });
  return createStore(reducer, state, applyMiddleware(createLogger()));
}