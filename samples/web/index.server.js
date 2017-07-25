import errToJSON from 'error-to-json';
import App from './App';
import createStore from './redux';
import React from 'react';
import { loader } from '../../src';
import ReactDOMServer from 'react-dom/server';

export default function server(req, res) {
  const store = createStore({});
  return loader(
    () => ReactDOMServer.renderToString(<App store={store} />),
    store,
    1000,
  ).then(({ html, state }) => {
      res.send(
`<!DOCTYPE html>
<html lang="en">
<body>
    <div id="react-root">${html}</div>
    <script type="text/javascript">var REDUX_STATE=${JSON.stringify(state)}</script>
    <script src="/dist/app.js"></script>
</body>
</html>`
      );
    })
    .catch(err =>
      res
        .status(err.status || 500)
        .json(errToJSON(err)),
    );
}