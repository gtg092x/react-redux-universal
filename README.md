# React Redux Universal

Universal apps with `redux`. :stars:

## Installation

`npm i react-redux-universal --save`

## Usage

### Component

```js
import React from 'react';
import universal from 'react-redux-universal';

function resolveCoolData(myCoolParam, dispatch) {
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
import createAppStore from './redux';

const store = createAppStore(window.REDUX_STATE);
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

#### Connect/Express

```js
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { Provider } from 'react-redux';
import App from './App';
import createAppStore from './redux';
import { loader } from 'react-redux-universal';

const TIMEOUT = 3000;
const INITIAL_STATE = {};
const INITIAL_PROPS = {};

// exporting an express middleware here
export default function server(req, res) {
  const store = createAppStore(INITIAL_STATE);
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
    }).catch((err) => {
      // possible timeout or error while rendering
    });
}
```

#### Koa

```js
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { Provider } from 'react-redux';
import App from './App';
import createAppStore from './redux';
import { loader } from 'react-redux-universal';

const TIMEOUT = 3000;
const INITIAL_STATE = {};
const INITIAL_PROPS = {};

// pass to koa.use
export default async function server(ctx) {
  const store = createAppStore(INITIAL_STATE);
  const { state, html } = await loader(
    () => ReactDOMServer.renderToString(
      <Provider store={store}>
        <App props={INITIAL_PROPS} />
      </Provider>
    ),
    store,
    TIMEOUT,
  );
  
  ctx.body = `<!DOCTYPE html>
<html lang="en">
 <body>
   <div id="react-root">${html}</div>
   <script type="text/javascript">var REDUX_STATE=${JSON.stringify(state)}</script>
   <script src="/dist/app.js"></script>
 </body>
</html>`;
}
```

## API

### Universal Enhancer

`universal(<keyName>, <mapPropsToParams>, <promiseCreator>, [<config>])`

The default export for `react-redux-universal` is the HOC that links your async state to a redux store.

- `keyName` This is the prop name used for your enhanced component. Four properties will be passed:
    - `{keyname}` - the result of the promise
    - `{keyname}Ready` - `true` if the promise is completed, `false` otherwise
    - `{keyname}Error` - an error object if the promise rejects
    - `{keyname}Reload()` - ignores the cache and reloads
- `mapPropsToParams` This method that accepts `(props, context)` and returns a value to be the params passed to the `promiseCreator`. This will be called on initialization and every prop change. If the result of this function changes, the `promiseCreator` will be called again.
- `promiseCreator` A function that accepts the result of `mapPropsToParams` and returns a thenable or constant value. The results of this are passed to the component as a prop and stored in a redux store for tranfer between server and client. For convenience, `dispatch` and `context` are passed to this method as well.
- `[config]`
    - `[config.getComponentId]` A method that accepts a `Component` and returns a unique id for it. Defaults to the Component name. This is important if you have different components loading keys with the same name.
    - `[config.onReadyChange]` A method that accepts `(readyStatus, props)`. When the promise is completed or initialized, this will fire.
    - `[config.onDone]` A method that accepts `(promiseResult, props)`. When the promise is resolved, this will fire.
    - `[config.onError]` A method that accepts `(promiseError, props)`. When the promise is rejected, this will fire.
    - `[config.shouldComponentReload]` A method that accepts `(oldParams, newParams)`. When this returns falsy, reloads are canceled. Note this is an additional check and will not be called if properties or redux state do not change.

Note: for promise lifecycle events, `props` includes `dispatch`.

### Loader

`loader(<getRenderer>, <store>, [<timeout>])`

This will attempt to load your app and resolve as soon as all mounted `universal` composers have resolved.

- `getRenderer` This is typically `() => ReactDOMServer.renderToString(<App />)`, however, you can pass any render method you like as long as it attempts to render your react app. If you have mounted universal components, this will likely be called twice but could be called more. Otherwise, this will be called once.
- `store` Your redux store. You'll need to initialize this outside of your app. *Note: this is only the case for server side rendering.*
- `[<timeout>]` A timeout for your app's load. The loader will reject once this time has expired. Pass `-1` if you do not want your app to timeout. Default is `3000` (3 seconds).
- `[<config>]` Additional Configuration.
  - `[config.next(state)]` A function that will call with every redux state change. If this function returns `false`, all subscriptions will be released and the app will immediately render. Defaults to `() => true`.
    - Combined with the history api, this is useful for redirects.
  - `[config.ensureRender(renderCount)]` A function that will call right before the loader returns HTML. If this returns true, the loader will render the component one last time. This is useful for child components that change the redux store and expect the parent components to update.
    - A constant `true` or `false` can be passed instead of a function to always or never render once more before delivery.

### Actions

#### clearAll

`clearAll()`

This will clear all universal data, causing all mounted universal components to reload.

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

Set your reducer as `universal` using `combineReducers`.
