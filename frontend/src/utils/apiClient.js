/**
 * API Client with centralized error handling
 */
class ApiClient {
  constructor(baseURL) {
    this.baseURL = this.resolveBaseURL(baseURL);
  }

  resolveBaseURL(baseURL) {
    const explicitBase = baseURL || import.meta.env.VITE_API_BASE;
    if (explicitBase) {
      return explicitBase.replace(/\/$/, "");
    }

    if (typeof window !== "undefined") {
      const { origin, hostname } = window.location;
      if (hostname === "localhost" || hostname === "127.0.0.1") {
        return "http://localhost:3001";
      }
      return origin;
    }

    return "http://localhost:3001";
  }

  /**
   * Make a request to the API
   * @param {string} endpoint - API endpoint
   * @param {RequestInit} options - Fetch options
   * @returns {Promise<any>} - Parsed JSON response
   * @throws {Error} - If request fails
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;

    try {
      return await this.fetchJson(url, options);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      const proxyUrl = this.getSameOriginProxyURL(endpoint);
      if (proxyUrl && proxyUrl !== url) {
        console.warn(`API request failed for ${url}; retrying through ${proxyUrl}`, error);
        try {
          return await this.fetchJson(proxyUrl, options);
        } catch (proxyError) {
          if (proxyError instanceof ApiError) {
            throw proxyError;
          }
          console.error("API proxy retry failed:", proxyError);
          throw new ApiError(
            `Network error while calling ${url} and fallback ${proxyUrl}. ${proxyError.message || "Please check your connection."}`,
            0,
            { originalError: proxyError, firstError: error }
          );
        }
      }

      // Network errors or other fetch failures
      console.error("API request failed:", error);
      throw new ApiError(
        `Network error while calling ${url}. ${error.message || "Please check your connection."}`,
        0,
        { originalError: error }
      );
    }
  }

  async fetchJson(url, options = {}) {
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        errorData.error || `API Error: ${response.statusText}`,
        response.status,
        errorData
      );
    }

    return await response.json();
  }

  getSameOriginProxyURL(endpoint) {
    if (typeof window === "undefined") {
      return null;
    }

    const { origin, hostname } = window.location;
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return null;
    }

    return `${origin}/api${endpoint}`;
  }

  /**
   * POST request
   * @param {string} endpoint - API endpoint
   * @param {any} data - Request body data
   * @returns {Promise<any>} - Parsed JSON response
   */
  async post(endpoint, data) {
    return this.request(endpoint, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  /**
   * GET request
   * @param {string} endpoint - API endpoint
   * @returns {Promise<any>} - Parsed JSON response
   */
  async get(endpoint) {
    return this.request(endpoint, {
      method: "GET",
    });
  }
}

/**
 * Custom API Error class
 */
export class ApiError extends Error {
  constructor(message, status = 0, data = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

// Create and export singleton instance
export const api = new ApiClient();
