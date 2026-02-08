// Empty shim for https module (not used in React Native)
export default {};
export const request = () => {
  throw new Error('https.request is not available in React Native');
};
export const get = () => {
  throw new Error('https.get is not available in React Native');
};
