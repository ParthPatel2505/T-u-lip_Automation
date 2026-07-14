/**
 * logger.js
 * ============================================================
 * Winston-based structured logger with console and file transports.
 * Logs are saved to reports/test-execution.log.
 * ============================================================
 */
import winston from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOG_DIR = path.resolve(__dirname, '..', 'reports');
const LOG_FILE = path.join(LOG_DIR, 'test-execution.log');

/**
 * Custom format for console output with colors and timestamps.
 */
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] ${level}: ${message}${metaStr}`;
  })
);

/**
 * Format for file output — JSON lines for easy parsing.
 */
const fileFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.json()
);

/**
 * Singleton logger instance.
 */
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  transports: [
    // Console transport — colorized, human-readable
    new winston.transports.Console({
      format: consoleFormat,
    }),
    // File transport — structured JSON
    new winston.transports.File({
      filename: LOG_FILE,
      format: fileFormat,
      maxsize: 5 * 1024 * 1024, // 5 MB
      maxFiles: 3,
    }),
  ],
});

/**
 * Log a test step for traceability.
 * @param {string} stepDescription
 */
export function logStep(stepDescription) {
  logger.info(`📍 STEP: ${stepDescription}`);
}

/**
 * Log a test action (click, fill, navigate, etc.)
 * @param {string} action
 * @param {string} [target]
 */
export function logAction(action, target) {
  logger.info(`▶️  ${action}${target ? ` → ${target}` : ''}`);
}

/**
 * Log a test validation/assertion.
 * @param {string} description
 */
export function logValidation(description) {
  logger.info(`✅ VERIFY: ${description}`);
}

/**
 * Log a warning.
 * @param {string} message
 */
export function logWarning(message) {
  logger.warn(`⚠️  ${message}`);
}

/**
 * Log an error with optional error object.
 * @param {string} message
 * @param {Error} [error]
 */
export function logError(message, error) {
  logger.error(`❌ ${message}`, { error: error?.message, stack: error?.stack });
}

export default logger;
