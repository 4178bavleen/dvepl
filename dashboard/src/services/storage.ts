export const storage = {
  get: (key: string) => localStorage.getItem(key),
  set: (key: string, val: string) => localStorage.setItem(key, val),
  remove: (key: string) => localStorage.removeItem(key),
  clear: () => localStorage.clear(),
};
