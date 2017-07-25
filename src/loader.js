import { values } from './util';

const selectUniversal = state => state.universal;

const getUniversalCaches = universal => values(universal).reduce((memo, val) =>
  [...memo, ...values(val)], []);

const getRequests = universal => getUniversalCaches(universal).filter(hash => !!hash.request);

export default function appServer(renderer, store, timeout = 30000) {
  return new Promise((resolve, reject) => {
    let html;
    try {
      html = renderer({ store });
    } catch (e) {
      reject(e);
      return;
    }
    let done;
    let to;
    let dispatched = false;
    const checkSub = () => {
      const requests = getRequests(selectUniversal(store.getState()));
      if (requests.length === 0) {
        clearTimeout(to);
        done();
        try {
          const finalState = store.getState();
          const nextHtml = dispatched ? renderer({ store }) : html;
          resolve({ html: nextHtml, state: finalState });
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
    if (timeout > 0) {
      to = setTimeout(() => {
        done();
        reject(new Error(`Timeout of ${timeout}ms exceeded.`));
      }, timeout);
    }
    setImmediate(checkSub);
  });
}
