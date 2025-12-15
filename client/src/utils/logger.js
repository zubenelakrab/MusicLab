// Conditional logger - only logs in development mode
const isDev = import.meta.env.DEV;

const logger = {
  log: (...args) => {
    if (isDev) console.log('[MusicLab]', ...args);
  },
  warn: (...args) => {
    if (isDev) console.warn('[MusicLab]', ...args);
  },
  error: (...args) => {
    // Always log errors
    console.error('[MusicLab]', ...args);
  },
  debug: (...args) => {
    if (isDev) console.debug('[MusicLab]', ...args);
  }
};

export default logger;
