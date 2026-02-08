// Empty shim for http module (not used in React Native)
export default {};
export const request = () => {
  throw new Error('http.request is not available in React Native');
};
export const get = () => {
  throw new Error('http.get is not available in React Native');
};
