import { values, isFunction } from './util';

const selectUniversal = state => state.universal;

const getUniversalCaches = universal => values(universal).reduce((memo, val) =>
  [...memo, ...values(val)], []);

const getRequests = universal => getUniversalCaches(universal).filter(hash => !!hash.request);

const taut = () => true;

export default async function appServer(renderer, store, timeout = 30000, config = {}) {
  let {
    next = taut,
    ensureRender = () => false,
  } = isFunction(config) ? { next: config } : config;
  if (!isFunction(ensureRender)) {
    const ensureRenderConstant = ensureRender;
    ensureRender = () => ensureRenderConstant;
  }
  let html;
  let to;
  let unsubDispatchWatch = null;
  let dispatched = false;
  let renderCount = 1;

  if (timeout > 0) {
    to = setTimeout(() => {
      if (unsubDispatchWatch) {
        unsubDispatchWatch();
      }
      throw new Error(`Timeout of ${timeout}ms exceeded.`);
    }, timeout);
  }

  unsubDispatchWatch = store.subscribe(() => {
    dispatched = true;
  });

  const tryRender = async () => {
    const finalState = store.getState();
    const requests = getRequests(selectUniversal(finalState));
    if (requests.length === 0 || !next(finalState)) {
      try {
        let nextHtml = dispatched ? renderer({ store }) : html;
        if (dispatched) {
          renderCount += 1;
          // if you dispatched during render will do one final render after requests have resolved
          // giving you a chance to mount child containers
          dispatched = false;
          html = nextHtml;
          return tryRender();
        }
        clearTimeout(to);
        unsubDispatchWatch();
        if (ensureRender(renderCount)) {
          nextHtml = renderer({ store });
        }
        return { html: nextHtml, state: finalState };
      } catch (e) {
        unsubDispatchWatch();
        throw e;
      }
    } else {
      await new Promise((resolve) => {
        const nextSub = store.subscribe(() => {
          dispatched = true;
          nextSub();
          resolve();
        });
      });
      return tryRender();
    }
  };
  try {
    html = renderer({ store });
  } catch (e) {
    throw e;
  }
  return tryRender();
}
