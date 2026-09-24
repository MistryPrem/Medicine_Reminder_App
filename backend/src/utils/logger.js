const SENSITIVE_KEYS = new Set([
  'password',
  'token',
  'accessToken',
  'refreshToken',
  'authorization',
  'secret',
  'fcmPrivateKey'
]);

const maskSensitiveData = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(maskSensitiveData);

  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = maskSensitiveData(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
};

const formatLog = (level, message, meta = {}) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...(Object.keys(meta).length > 0 && { meta: maskSensitiveData(meta) })
  };

  if (process.env.NODE_ENV === 'development') {
    const metaStr = Object.keys(meta).length > 0 ? ` | ${JSON.stringify(logEntry.meta)}` : '';
    return `[${logEntry.timestamp}] [${level.toUpperCase()}]: ${message}${metaStr}`;
  }

  return JSON.stringify(logEntry);
};

export const logger = {
  info: (message, meta) => {
    console.log(formatLog('info', message, meta));
  },
  warn: (message, meta) => {
    console.warn(formatLog('warn', message, meta));
  },
  error: (message, meta) => {
    console.error(formatLog('error', message, meta));
  },
  debug: (message, meta) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(formatLog('debug', message, meta));
    }
  }
};
