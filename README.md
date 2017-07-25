# React Redux Universal

Universal apps with `redux`. :stars:

## Installation

`npm i react-redux-universal --save`

## Usage

### Component

```js
import React from 'react';
import universal from 'react-redux-universal';

function resolveCoolData(myCoolParam) {
  return Promise.resolve(coolParam + ' is pretty cool');
}

const universalEnhancer = universal('myParam', props => props.myCoolParam, resolveCoolData);

const MyAsyncComponent = universalEnhancer(
  ({ myParam, myParamReady, myParamError }) =>
    <div>Look at this awesome async data! {myParam}</div>
);

export default MyAsyncComponent;
```

### Redux Store

```js
import { createStore, combineReducers } from 'redux';
import { reducer as universal } from 'react-redux-universal';

export default function createAppStore(state) {
  const reducer = combineReducers({
    universal,
    // other reducers - it's a normal old redux store
  });
  return createStore(reducer, state);
}
```

### Client

```js
import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import App from './App';
import createStore from './redux';

const store = createStore(window.REDUX_STATE);
const element = (
  <Provider store={store}>
      <App />
  </Provider>
);

ReactDOM.render(
  element,
  document.getElementById('react-root')
);
```

### Server

```js
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { Provider } from 'react-redux';
import App from './App';
import createStore from './redux';
import { loader } from '../../src';

const TIMEOUT = 3000;
const INITIAL_STATE = {};
const INITIAL_PROPS = {};

// exporting an express middleware here
export default function server(req, res) {
  const store = createStore(INITIAL_STATE);
  return loader(
    () => ReactDOMServer.renderToString(
      <Provider store={store}>
        <App props={INITIAL_PROPS} />
      </Provider>
    ),
    store,
    TIMEOUT,
  ).then(({ html, state }) => {
    // check state for errors or a new route
    // do whatever with res that you want
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
    });
}
```

## API

### Universal Enhancer

`universal(<keyName>, <mapPropsToParams>, <promiseCreator>, [<config>])`

The default export for `react-redux-universal` is the HOC that links your async state to a redux store.

- `keyName` This is the prop name used for your enhanced component. Three properties will be passed:
    - `{keyname}` - the result of the promise
    - `{keyname}Ready` - `true` if the promise is completed, `false` otherwise
    - `{keyname}Error` - an error object if the promise rejects
- `mapPropsToParams` This method that accepts `(props, context)` and returns a value to be the params passed to the `promiseCreator`. This will be called on initialization and every prop change. If the result of this function changes, the `promiseCreator` will be called again.
- `promiseCreator` A function that accepts the result of `mapPropsToParams` and returns a thenable or constant value. The results of this are passed to the component as a prop and stored in a redux store for tranfer between server and client. For convenience, context is passed to this method as well.
- `[config]`
    - `[config.getComponentId]` A method that accepts a `Component` and returns a unique id for it. Defaults to the Component name. This is important if you have different components loading keys with the same name.
    - `[config.onReadyChange]` A method that accepts `(readyStatus, props, dispatch)`. When the promise is completed or initialized, this will fire.
    - `[config.onDone]` A method that accepts `(promiseResult, props)`. When the promise is resolved, this will fire.
    - `[config.onError]` A method that accepts `(promiseError, props)`. When the promise is rejected, this will fire.

Note: for promise lifecycle events, `props` includes `dispatch`.

### Loader

`loader(<getRenderer>, <store>, [<timeout>])`

This will attempt to load your app and resolve as soon as all mounted `universal` composers have resolved.

- `getRenderer` This is typically `() => ReactDOMServer.renderToString(<App />)`, however, you can pass any render method you like as long as it attempts to render your react app. If you have mounted universal components, this will likely be called twice but could be called more. Otherwise, this will be called once.
- `store` Your redux store. You'll need to initialize this outside of your app. *Note: this is only the case for server side rendering.*
- `[<timeout>]` A timeout for your app's load. The loader will reject once this time has expired. Pass `-1` if you do not want your app to timeout. Default is `3000` (3 seconds).

### Actions

#### clearAll

`clearAll()`

This will clear all universal data, causing all mounted universal components to reload on next property change.

```js
import { clearAll } from 'react-redux-universal';

store.dispatch(clearAll());
```

### Reducer

A preconfigured reducer. This must be in your app's root reducer.

```js
import { reducer as universal } from 'react-redux-universal';

const reducer = combineReducers({
    universal,
    // other reducers
  });
```

It's recommended you that you set your reducer as `universal` using `combineReducer`.
