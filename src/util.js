export const omit = (obj, key) => {
  const keysNorm = Array.isArray(key) ? key : [key];
  return Object.keys(obj).reduce((memo, oKey) => (
    keysNorm.includes(oKey) ? memo : { ...memo, [oKey]: obj[oKey] }
  ), {});
};
