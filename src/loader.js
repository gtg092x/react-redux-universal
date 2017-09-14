import { values } from './util';

const selectUniversal = state => state.universal;

const getUniversalCaches = universal => values(universal).reduce((memo, val) =>
  [...memo, ...values(val)], []);

const getRequests = universal => getUniversalCaches(universal).filter(hash => !!hash.request);

const taut = () => true;

export default function appServer(renderer, store, timeout = 30000, next = taut) {
  return new Promise((resolve, reject) => {
    let html;
    let to;
    let unsub;
    let dispatched = false;
    const checkSub = () => {
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
            setImmediate(checkSub);
            return;
          }
          clearTimeout(to);
          unsub();
          resolve({ html: nextHtml, state: finalState });
        } catch (e) {
          unsub();
          reject(e);
        }
      } else {
        html = null;
      }
    };
    unsub = store.subscribe(() => {
      dispatched = true;
      setImmediate(checkSub);
    });
    try {
      html = renderer({ store });
    } catch (e) {
      reject(e);
      return;
    }
    if (timeout > 0) {
      to = setTimeout(() => {
        unsub();
        reject(new Error(`Timeout of ${timeout}ms exceeded.`));
      }, timeout);
    }
    setImmediate(checkSub);
  });
}
