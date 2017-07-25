const selectIso = state => state.iso;

const values = (obj = {}) => Object.keys(obj)
  .reduce((memo, key) => ([...memo, obj[key]]), []);

const getRequests = iso => values(iso).reduce((memo, val) =>
  [...memo, ...values(val)], []).filter(hash => !!hash.request);

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
    const checkSub = () => {
      const requests = getRequests(selectIso(store.getState()));
      if (requests.length === 0) {
        clearTimeout(to);
        done();
        try {
          const nextHtml = html || renderer({ store });
          resolve({ html: nextHtml, state: store.getState() });
        } catch (e) {
          reject(e);
        }
      } else {
        html = null;
      }
    };
    done = store.subscribe(() => setImmediate(checkSub));
    if (timeout > 0) {
      to = setTimeout(() => {
        done();
        reject(new Error(`Timeout of ${timeout}ms exceeded.`));
      }, timeout);
    }
    setImmediate(checkSub);
  });
}
