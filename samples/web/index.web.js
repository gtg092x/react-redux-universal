import React from 'react';
import App from './App';
import createStore from './redux';
import ReactDOM from 'react-dom';

const store = createStore(window.REDUX_STATE);
const element = (
  <App
    store={store}
  />
);

ReactDOM.render(
  element,
  document.getElementById('react-root')
);