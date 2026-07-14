/**
 * helper.js
 * ============================================================
 * Common utility / helper functions used across the framework.
 * ============================================================
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Generate a random alphanumeric string of the given length.
 * @param {number} [length=10]
 * @returns {string}
 */
export function generateRandomString(length = 10) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Generate a random email address.
 * @param {string} [domain='test.com']
 * @returns {string}
 */
export function generateRandomEmail(domain = 'test.com') {
  return `testuser_${generateRandomString(8)}@${domain}`;
}

/**
 * Generate a random number between min and max (inclusive).
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export function generateRandomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Get the current timestamp in ISO format.
 * @returns {string}
 */
export function getCurrentTimestamp() {
  return new Date().toISOString();
}

/**
 * Format a date to a given format string.
 * Supports: YYYY, MM, DD, HH, mm, ss
 * @param {Date} [date=new Date()]
 * @param {string} [format='YYYY-MM-DD']
 * @returns {string}
 */
export function formatDate(date = new Date(), format = 'YYYY-MM-DD') {
  const pad = (n) => String(n).padStart(2, '0');
  return format
    .replace('YYYY', String(date.getFullYear()))
    .replace('MM', pad(date.getMonth() + 1))
    .replace('DD', pad(date.getDate()))
    .replace('HH', pad(date.getHours()))
    .replace('mm', pad(date.getMinutes()))
    .replace('ss', pad(date.getSeconds()));
}

/**
 * Read and parse a JSON file.
 * @param {string} filePath - Absolute or relative path to the JSON file
 * @returns {object}
 */
export function readJsonFile(filePath) {
  const resolvedPath = path.isAbsolute(filePath)
    ? filePath
    : path.resolve(__dirname, '..', filePath);
  const raw = fs.readFileSync(resolvedPath, 'utf-8');
  return JSON.parse(raw);
}

/**
 * Write an object to a JSON file.
 * @param {string} filePath - Absolute or relative path
 * @param {object} data
 */
export function writeJsonFile(filePath, data) {
  const resolvedPath = path.isAbsolute(filePath)
    ? filePath
    : path.resolve(__dirname, '..', filePath);
  fs.writeFileSync(resolvedPath, JSON.stringify(data, null, 2), 'utf-8');
}

/**
 * Retry a function a given number of times with a delay between each attempt.
 * @param {Function} fn - Async function to retry
 * @param {number} [retries=3]
 * @param {number} [delayMs=1000]
 * @returns {Promise<*>}
 */
export async function retry(fn, retries = 3, delayMs = 1000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === retries) throw error;
      console.warn(`Attempt ${attempt} failed. Retrying in ${delayMs}ms...`);
      await waitFor(delayMs);
    }
  }
}

/**
 * Wait for a given number of milliseconds.
 * @param {number} ms
 * @returns {Promise<void>}
 */
export function waitFor(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Capitalize the first letter of a string.
 * @param {string} str
 * @returns {string}
 */
export function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Slugify a string (e.g., "Hello World" → "hello-world").
 * @param {string} str
 * @returns {string}
 */
export function slugify(str) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Deep clone an object via JSON serialization.
 * @param {object} obj
 * @returns {object}
 */
export function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Get user data from the data/users.json file by role.
 * @param {string} role - e.g., 'admin', 'default', 'member'
 * @returns {{ username: string, password: string, description?: string }}
 */
export function getUserByRole(role) {
  const users = readJsonFile('data/users.json');
  if (!users[role]) {
    throw new Error(`User role "${role}" not found in data/users.json`);
  }
  return users[role];
}

/**
 * Get environment variable or throw if not set.
 * @param {string} name
 * @param {string} [defaultValue]
 * @returns {string}
 */
export function getEnvVar(name, defaultValue) {
  const value = process.env[name] || defaultValue;
  if (value === undefined) {
    throw new Error(`Environment variable "${name}" is not set and no default provided.`);
  }
  return value;
}
