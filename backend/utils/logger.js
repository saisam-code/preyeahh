const isDevelopment = process.env.NODE_ENV !== "production";

const logger = {
  dev: (...args) => {
    if (isDevelopment) console.log(...args);
  },
  info: (...args) => {
    console.log(...args);
  },
  warn: (...args) => {
    console.warn(...args);
  },
  error: (...args) => {
    console.error(...args);
  },
};

export default logger;
