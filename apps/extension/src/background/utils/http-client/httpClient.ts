/**
 * HTTP client for UniSat API
 */

/// <reference lib="dom" />

import {
  ApiClientError,
  HttpError,
  NetworkError,
  ParseError,
  RateLimitError,
  ServiceUnavailableError,
  TimeoutError,
  getRetryDelay,
  isRetryableError
} from './errors';
import type { ApiResponse, ClientConfig, RequestConfig } from './types';

/**
 * HTTP request options
 */
export interface RequestOptions extends RequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: any;
  query?: Record<string, any>;
}

export interface BaseHttpClient {
  get<T = any>(url: string, options?: RequestOptions): Promise<T>;
  post<T = any>(url: string, body?: any, options?: RequestOptions): Promise<T>;

  setBaseURL(baseURL: string): void;
  setHeaders(headers: Record<string, string>): void;
}

/**
 * HTTP client implementation
 */
export class HttpClient implements BaseHttpClient {
  private readonly baseURL: string;
  private readonly defaultConfig: Required<Pick<ClientConfig, 'timeout' | 'retries'>>;
  private readonly defaultHeaders: Record<string, string>;

  constructor(config: ClientConfig = {}) {
    this.baseURL = config.endpoint || 'https://api.unisat.io';
    this.defaultConfig = {
      timeout: config.timeout || 30000,
      retries: config.retries || 3
    };

    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'User-Agent': config.userAgent || 'UniLit-API-Client/1.0',
      'X-Client': 'UniLit Wallet',
      ...config.headers
    };

    if (config.apiKey) {
      this.defaultHeaders['Authorization'] = `Bearer ${config.apiKey}`;
    }
  }

  /**
   * Make an HTTP request
   */
  async request<T = any>(path: string, options: RequestOptions = {}): Promise<T> {
    const {
      method = 'GET',
      body,
      query,
      timeout = this.defaultConfig.timeout,
      retries = this.defaultConfig.retries,
      headers = {}
    } = options;

    const url = this.buildUrl(path, query);
    const requestHeaders = { ...this.defaultHeaders, ...headers };

    let lastError: Error;

    for (let attempt = 1; attempt <= retries + 1; attempt++) {
      try {
        const requestInit: RequestInit = {
          method,
          headers: requestHeaders,
          signal: AbortSignal.timeout(timeout)
        };

        if (body) {
          requestInit.body = JSON.stringify(body);
        }

        const response = await this.makeRequest(url, requestInit);

        return await this.handleResponse<T>(response);
      } catch (error) {
        lastError = error as Error;

        // Don't retry on the last attempt or non-retryable errors
        if (attempt === retries + 1 || !isRetryableError(lastError)) {
          break;
        }

        // Wait before retrying
        const delay = getRetryDelay(lastError, attempt);
        await this.sleep(delay);
      }
    }

    throw lastError!;
  }

  /**
   * Make a GET request
   */
  async get<T = any>(path: string, options: Omit<RequestOptions, 'method' | 'body'> = {}): Promise<T> {
    return this.request<T>(path, { ...options, method: 'GET' });
  }

  /**
   * Make a POST request
   */
  async post<T = any>(path: string, body?: any, options: Omit<RequestOptions, 'method' | 'body'> = {}): Promise<T> {
    return this.request<T>(path, { ...options, method: 'POST', body });
  }

  /**
   * Make a PUT request
   */
  async put<T = any>(path: string, body?: any, options: Omit<RequestOptions, 'method' | 'body'> = {}): Promise<T> {
    return this.request<T>(path, { ...options, method: 'PUT', body });
  }

  /**
   * Make a DELETE request
   */
  async delete<T = any>(path: string, options: Omit<RequestOptions, 'method' | 'body'> = {}): Promise<T> {
    return this.request<T>(path, { ...options, method: 'DELETE' });
  }

  /**
   * Build URL with query parameters
   */
  /**
   * Litescribe still serves the pre-v5 UniSat routes (`/address/balance`).
   */
  private normalizePath(path: string): string {
    if (!this.baseURL.includes('litescribe.io')) return path;
    if (path.startsWith('/v5/')) return path.slice(3);
    if (path.startsWith('v5/')) return path.slice(3);
    return path;
  }

  private buildUrl(path: string, query?: Record<string, any>): string {
    path = this.normalizePath(path);
    // Ensure baseURL ends with / and path doesn't start with /
    const normalizedBaseURL = this.baseURL.endsWith('/') ? this.baseURL : this.baseURL + '/';
    const normalizedPath = path.startsWith('/') ? path.slice(1) : path;
    const url = new URL(normalizedPath, normalizedBaseURL);

    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    return url.toString();
  }

  /**
   * Make the actual HTTP request
   */
  private async makeRequest(url: string, init: RequestInit): Promise<Response> {
    try {
      const response = await fetch(url, init);
      return response;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw new TimeoutError(this.defaultConfig.timeout);
      }
      throw new NetworkError(`Network error: ${error.message}`, error);
    }
  }

  /**
   * Handle HTTP response
   */
  private async handleResponse<T>(response: Response): Promise<T> {
    // Handle rate limiting
    if (response.status === 429) {
      const retryAfter = parseInt(response.headers.get('Retry-After') || '60');
      throw new RateLimitError('Rate limit exceeded', retryAfter);
    }

    // Handle other HTTP errors
    if (!response.ok) {
      if (response.status >= 500) {
        throw new ServiceUnavailableError(`Service unavailable: ${response.status} ${response.statusText}`);
      }
      throw new HttpError(response.status, response.statusText);
    }

    // Parse response. Litescribe prefixes JSON with a UTF-8 BOM.
    let data: any;
    try {
      const text = typeof response.text === 'function' ? await response.text() : '';
      const body = text.replace(/^\uFEFF/, '').trim();
      data = body ? JSON.parse(body) : await response.json();
    } catch (error) {
      throw new ParseError('Failed to parse JSON response', error);
    }

    // Handle API-level errors
    if (this.isApiResponse(data)) {
      if (data.code !== 0) {
        // Assuming 0 is success
        throw new ApiClientError(data.msg || 'API error', data.code);
      }
      return data.data;
    }

    if (this.isLitescribeResponse(data)) {
      if (data.status !== 0 && data.status !== 1) {
        throw new ApiClientError(data.message || 'API error', data.status);
      }
      return data.result;
    }

    return data;
  }

  /**
   * Check if response is in API format
   */
  private isApiResponse(data: any): data is ApiResponse {
    return data && typeof data === 'object' && 'code' in data && 'msg' in data;
  }

  private isLitescribeResponse(data: any): data is { status: number; message?: string; result: any } {
    return data && typeof data === 'object' && 'status' in data && 'result' in data;
  }

  /**
   * Sleep utility for retries
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Update base URL
   */
  setBaseURL(baseURL: string): void {
    (this as any).baseURL = baseURL;
  }

  /**
   * Update default headers
   */
  setHeaders(headers: Record<string, string>): void {
    Object.assign(this.defaultHeaders, headers);
  }

  /**
   * Remove a header
   */
  removeHeader(name: string): void {
    delete this.defaultHeaders[name];
  }
}
