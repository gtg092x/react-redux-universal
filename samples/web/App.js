import React from 'react';
import Home from './components/Home';
import { Provider } from 'react-redux';

const App = ({ store }) => (
  <Provider store={store}>
    <Home />
  </Provider>
);

export default App;