import React from 'react';
import { assert } from 'chai';
import { createStore, combineReducers } from 'redux';
import { Provider } from 'react-redux';
import { renderToString, renderToStaticMarkup } from 'react-dom/server';
import universalContainer, { reducer as universal, loader, clearAll } from '../src/index';

const testLoader = universalContainer(
  'testKey',
  ({ myParam }) => myParam,
  myParam => Promise.resolve(myParam),
);

const RESULT = '@react-universal/RESULT';

const KVP = '@KVP';

const simpleKvp = (state = {}, action = {}) => {
  switch (action.type) {
    case KVP:
      return {
        ...state,
        [action.key]: action.data,
      };
    default:
      return state;
  }
};

const reducer = combineReducers({
  universal,
  simpleKvp,
});

describe('universal redux.', () => {
  it('reducer should work', () => {
    reducer({}, {type: 'pass'});
  });
  it('reducer should clear', () => {
    const initialState = {universal: {}, simpleKvp: {}};
    const store = createStore(reducer, initialState);
    const hash = 'test-hash';
    const key = 'test-key';
    const data = 'foo';
    store.dispatch({
      type: RESULT,
      hash,
      key,
      data,
    });
    let state = store.getState();
    assert.equal(data, state['universal'][key][hash].result);
    store.dispatch(clearAll());
    state = store.getState();
    assert.deepEqual(initialState, state);
  });
  it('should resolve params', done => {
    const keyParam = 'testParam';
    const Component = testLoader(({ testKey }) => {
      if (testKey) {
        assert.equal(testKey, keyParam);
        done();
      }
      return null;
    });
    const store = createStore(reducer);
    const Element = (
      <Provider store={store}>
        <Component myParam={keyParam} />
      </Provider>
    );
    // setup
    renderToString(Element);
    // ready
    setImmediate(() => renderToString(Element));
  });
  it('loader should resolve valid html', done => {
    const keyParam = 'testParam';
    const Component = testLoader(({ testKey }) => {
      return <div>{testKey}</div>;
    });
    const store = createStore(reducer);
    const Element = (
      <Provider store={store}>
        <Component myParam={keyParam} />
      </Provider>
    );

    loader(
      () => renderToStaticMarkup(Element),
      store,
    ).then(({ html, state }) => {
      assert.equal(html.replace(/\s/g, ''), '<div>testParam</div>');
      done();
    });
  });
  it('loader should send valid state', done => {
    const keyParam = 'testParam';
    const store = createStore(reducer);
    const Component = testLoader(class Component extends React.Component {
      componentWillMount() {
        store.dispatch({
          type: KVP,
          data: 'bar',
          key: 'foo',
        })
      }
      render() {
        return <div></div>;
      }
    });
    const Element = (
      <Provider store={store}>
        <Component myParam={keyParam} />
      </Provider>
    );

    loader(
      () => renderToStaticMarkup(Element),
      store,
    ).then(({ state }) => {
      assert.deepEqual(state.simpleKvp, {foo: 'bar'});
      done();
    });
  });
  it('no loaders should render once', done => {

    const Component = () => <div></div>;
    const store = createStore(reducer);
    const Element = (
      <Provider store={store}>
        <Component />
      </Provider>
    );
    let renderCount = 0;
    loader(
      () => {
        renderCount ++;
        return renderToStaticMarkup(Element);
      },
      store,
    ).then(({ html, state }) => {
      assert.equal(renderCount, 1);
      done();
    })
  });
});
