import { values } from './util';

const selectUniversal = state => state.universal;

const getUniversalCaches = universal => values(universal).reduce((memo, val) =>
  [...memo, ...values(val)], []);

const getRequests = universal => getUniversalCaches(universal).filter(hash => !!hash.request);

const taut = () => true;

export default async function appServer(renderer, store, timeout = 30000, next = taut) {
  let html;
  let to;
  let unsubDispatchWatch = null;
  let dispatched = false;

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
        const nextHtml = dispatched ? renderer({ store }) : html;
        if (dispatched) {
          // if you dispatched during render will do one final render after requests have resolved
          // giving you a chance to mount child containers
          dispatched = false;
          html = nextHtml;
          return tryRender();
        }
        clearTimeout(to);
        unsubDispatchWatch();
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
