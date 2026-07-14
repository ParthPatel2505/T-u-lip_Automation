/**
 * apiHelper.js
 * ============================================================
 * Wrapper around Playwright's APIRequestContext for API testing.
 * Provides convenient methods for GET, POST, PUT, PATCH, DELETE
 * with automatic JSON parsing and optional auth headers.
 * ============================================================
 */
import logger from './logger.js';

export class ApiHelper {
  /**
   * @param {import('@playwright/test').APIRequestContext} request - Playwright API request context
   * @param {string} [authToken] - Optional Bearer token for authenticated requests
   */
  constructor(request, authToken = '') {
    this.request = request;
    this.authToken = authToken;
  }

  /**
   * Set the auth token for subsequent requests.
   * @param {string} token
   */
  setAuthToken(token) {
    this.authToken = token;
  }

  /**
   * Build default headers, including Authorization if a token is set.
   * @param {object} [customHeaders={}]
   * @returns {object}
   */
  _buildHeaders(customHeaders = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...customHeaders,
    };
    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }
    return headers;
  }

  /**
   * Send a GET request.
   * @param {string} url - Endpoint URL (relative or absolute)
   * @param {object} [options] - Additional options (params, headers)
   * @returns {Promise<{ status: number, body: any, headers: object }>}
   */
  async get(url, options = {}) {
    logger.info(`API GET: ${url}`);
    const response = await this.request.get(url, {
      headers: this._buildHeaders(options.headers),
      params: options.params,
    });
    return this._parseResponse(response);
  }

  /**
   * Send a POST request.
   * @param {string} url
   * @param {object} [data] - Request body
   * @param {object} [options] - Additional options (headers)
   * @returns {Promise<{ status: number, body: any, headers: object }>}
   */
  async post(url, data = {}, options = {}) {
    logger.info(`API POST: ${url}`);
    const response = await this.request.post(url, {
      headers: this._buildHeaders(options.headers),
      data,
    });
    return this._parseResponse(response);
  }

  /**
   * Send a PUT request.
   * @param {string} url
   * @param {object} [data] - Request body
   * @param {object} [options]
   * @returns {Promise<{ status: number, body: any, headers: object }>}
   */
  async put(url, data = {}, options = {}) {
    logger.info(`API PUT: ${url}`);
    const response = await this.request.put(url, {
      headers: this._buildHeaders(options.headers),
      data,
    });
    return this._parseResponse(response);
  }

  /**
   * Send a PATCH request.
   * @param {string} url
   * @param {object} [data] - Request body
   * @param {object} [options]
   * @returns {Promise<{ status: number, body: any, headers: object }>}
   */
  async patch(url, data = {}, options = {}) {
    logger.info(`API PATCH: ${url}`);
    const response = await this.request.patch(url, {
      headers: this._buildHeaders(options.headers),
      data,
    });
    return this._parseResponse(response);
  }

  /**
   * Send a DELETE request.
   * @param {string} url
   * @param {object} [options]
   * @returns {Promise<{ status: number, body: any, headers: object }>}
   */
  async delete(url, options = {}) {
    logger.info(`API DELETE: ${url}`);
    const response = await this.request.delete(url, {
      headers: this._buildHeaders(options.headers),
    });
    return this._parseResponse(response);
  }

  /**
   * Parse the API response into a structured object.
   * @param {import('@playwright/test').APIResponse} response
   * @returns {Promise<{ status: number, body: any, headers: object }>}
   */
  async _parseResponse(response) {
    const status = response.status();
    let body;
    try {
      body = await response.json();
    } catch {
      body = await response.text();
    }
    const headers = response.headers();

    logger.info(`API Response: ${status}`);
    return { status, body, headers };
  }
}
