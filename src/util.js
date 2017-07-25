export const omit = (obj, key) => {
  const keysNorm = Array.isArray(key) ? key : [key];
  return Object.keys(obj).reduce((memo, oKey) => (
    keysNorm.includes(oKey) ? memo : { ...memo, [oKey]: obj[oKey] }
  ), {});
};

export const values = (obj = {}) => Object.keys(obj)
  .reduce((memo, key) => ([...memo, obj[key]]), []);
