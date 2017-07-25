import React from 'react';
import checksum from 'json-checksum';
import PropTypes from 'prop-types';
import errorToJSON from 'error-to-json';
import { connect } from 'react-redux';
import { omit } from './util';
import { setResult, setRequest, setError, clear } from './reducer';

const selectUniversalState = key => state => state.universal[key];

const getDisplayName = Component =>
  Component.displayName || Component.name || 'Component';

const defaults = (target, ...args) => Object.assign({}, target, ...args);

const OPTIONS_DEFAULTS = {
  getComponentId: getDisplayName,
};

const universal = (
  key,
  selectParams,
  promiseCreator,
  options = {}) => {
  const {
    getComponentId,
  } = defaults(options, OPTIONS_DEFAULTS);
  return Component =>
    connect(
      state => ({ universalState: selectUniversalState(key)(state) }),
      {
        universalSetResult: setResult.bind(null, key),
        universalSetRequest: setRequest.bind(null, key),
        universalSetError: setError.bind(null, key),
        universalClear: clear.bind(null, key),
      },
    )(
      class UniversalWrapper extends React.Component {
        constructor() {
          super();
          this.getUniqueKey = this.getUniqueKey.bind(this);
          this.load = this.load.bind(this);
          this.unload = this.unload.bind(this);
          this.getParams = this.getParams.bind(this);
          this.getUniversalState = this.getUniversalState.bind(this);
        }
        static contextTypes = {
          ...Component.contextTypes,
        };
        static propTypes = {
          universalClear: PropTypes.func,
          universalSetResult: PropTypes.func,
          universalSetError: PropTypes.func,
          universalSetRequest: PropTypes.func,
          universalState: PropTypes.object,
        };
        componentWillMount() {
          this.load();
        }
        componentWillReceiveProps(newProps, newContext) {
          if (this.getUniqueKey(newProps, newContext) !== this.getUniqueKey()) {
            this.unload();
            this.load(newProps, newContext);
          }
        }
        getParams(props = this.props, context = this.context) {
          return selectParams(props, context);
        }
        unload(props = this.props) {
          const ukey = this.getUniqueKey(props);
          this.props.universalClear(ukey);
        }
        getUniversalState(props = this.props, context = this.context) {
          const ukey = this.getUniqueKey(props, context);
          const { universalState = {} } = props;
          return universalState[ukey];
        }
        load(props = this.props, context = this.context) {
          const ukey = this.getUniqueKey(props, context);
          const universalState = this.getUniversalState(props, context);
          if (!universalState) {
            this.props.universalSetRequest(ukey);
            Promise.resolve(promiseCreator(this.getParams(props, context), context))
              .then(result => this.props.universalSetResult(ukey, result))
              .catch((error) => {
                this.props.universalSetError(ukey, errorToJSON(error));
              });
          }
        }
        getUniqueKey(props = this.props, context = this.context) {
          const params = checksum([this.getParams(props, context)]);
          // eslint-disable-next-line no-underscore-dangle
          const name = getComponentId(Component) || '';
          return `${name}:${params}`;
        }
        render() {
          const universalState = this.getUniversalState() || {};
          const {
            result,
            error,
            request,
          } = universalState;
          const params = {
            [key]: result,
            [`${key}Ready`]: !request,
          };
          if (error) {
            params[`${key}Error`] = error;
          }
          const componentProps = omit(
            this.props,
            Object.keys(UniversalWrapper.propTypes),
          );
          return <Component {...params} {...componentProps} />;
        }
      });
}

export default universal;
