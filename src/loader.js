import { values } from './util';

const selectUniversal = state => state.universal;

const getUniversalCaches = universal => values(universal).reduce((memo, val) =>
  [...memo, ...values(val)], []);

const getRequests = universal => getUniversalCaches(universal).filter(hash => !!hash.request);

const taut = () => true;

export default function appServer(renderer, store, timeout = 30000, next = taut) {
  return new Promise((resolve, reject) => {
    let done;
    let html;
    let to;
    let dispatched = false;
    const checkSub = () => {
      const finalState = store.getState();
      const requests = getRequests(selectUniversal(finalState));
      if (requests.length === 0 || !next(finalState)) {
        clearTimeout(to);
        done();
        try {
          const nextHtml = dispatched ? renderer({ store }) : html;
          resolve({ html: nextHtml, state: store.getState() });
        } catch (e) {
          reject(e);
        }
      } else {
        html = null;
      }
    };
    done = store.subscribe(() => {
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
        done();
        reject(new Error(`Timeout of ${timeout}ms exceeded.`));
      }, timeout);
    }
    setImmediate(checkSub);
  });
}
