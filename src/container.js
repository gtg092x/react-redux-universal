import React from 'react';
import checksum from 'json-checksum';
import errorToJSON from 'error-to-json';
import { connect } from 'react-redux';
import { omit } from './util';
import { setResult, setRequest, setError, clear } from './reducer';

const defaultSelectIsoState = key => state => state.iso[key];

const iso = (
  key,
  selectParams,
  promiseCreator,
  {
    selectIsoState = defaultSelectIsoState,
  } = {}) =>
  Component =>
  connect(
    state => ({ isoState: selectIsoState(key)(state) }),
    {
      isoSetResult: setResult.bind(null, key),
      isoSetRequest: setRequest.bind(null, key),
      isoSetError: setError.bind(null, key),
      isoClear: clear.bind(null, key),
    },
  )(
    class IsoWrapper extends React.Component {
      constructor() {
        super();
        this.getUniqueKey = this.getUniqueKey.bind(this);
        this.load = this.load.bind(this);
        this.unload = this.unload.bind(this);
        this.getParams = this.getParams.bind(this);
        this.getIsoState = this.getIsoState.bind(this);
      }
      static contextTypes = {
        ...Component.contextTypes,
      };
      componentWillMount() {
        this.load();
      }
      componentWillReceiveProps(newProps) {
        console.log('RECEIVE', newProps.isoState);
        if (this.getUniqueKey(newProps) !== this.getUniqueKey()) {
          this.unload();
          this.load(newProps);
        }
      }
      getParams(props = this.props, context = this.context) {
        return selectParams(props, context);
      }
      unload(props = this.props) {
        const ukey = this.getUniqueKey(props);
        this.props.isoClear(ukey);
      }
      getIsoState(props = this.props) {
        const ukey = this.getUniqueKey(props);
        const { isoState = {} } = props;
        return isoState[ukey];
      }
      load(props = this.props) {
        const ukey = this.getUniqueKey(props);
        const isoState = this.getIsoState(props);
        if (!isoState) {
          this.props.isoSetRequest(ukey);
          Promise.resolve(promiseCreator(this.getParams(props), this.context))
            .then(result => this.props.isoSetResult(ukey, result))
            .catch((error) => {
              this.props.isoSetError(ukey, errorToJSON(error));
            });
        }
      }
      getUniqueKey(props = this.props) {
        const params = checksum([this.getParams(props)]);
        // eslint-disable-next-line no-underscore-dangle
        return params;
      }
      render() {
        const isoState = this.getIsoState() || {};
        const {
          result,
          error,
          request,
        } = isoState;
        const params = {
          [key]: result,
          [`${key}Ready`]: !request,
        };
        if (error) {
          params[`${key}Error`] = error;
        }
        const componentProps = omit(this.props, [
          'isoClear',
          'isoSetResult',
          'isoSetError',
          'isoSetRequest',
          'isoState',
        ]);
        return <Component {...params} {...componentProps} />;
      }
    });

export default iso;
