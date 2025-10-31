/**
 * Shared HTTP client with dev-auth support
 * Consolidates the nearly identical fetch wrappers from admin and mobile
 */

export interface HttpClientConfig {
  apiBase?: string;
  authDisabled?: boolean;
  onUnauthorized?: () => void;
}

export class HttpClient {
  private apiBase: string;
  private authDisabled: boolean;
  private onUnauthorized?: () => void;

  constructor(config: HttpClientConfig = {}) {
    this.apiBase = config.apiBase || '';
    this.authDisabled = config.authDisabled || false;
    this.onUnauthorized = config.onUnauthorized;
  }

  private async request(path: string, options: RequestInit & { body?: unknown } = {}): Promise<any> {
    const { method = 'GET', headers = {}, body, ...rest } = options;

    const init: RequestInit = {
      method,
      headers: {
        ...headers,
      } as Record<string, string>,
      credentials: 'include',
      ...rest,
    };

    // In dev-auth-disabled mode, send a local-only header to allow mock user bypass
    if (this.authDisabled) {
      (init.headers as Record<string, string>)['x-dev-auth'] = '1';
    }

    if (body !== undefined) {
      init.body = typeof body === 'string' ? body : JSON.stringify(body);
      if (!(init.headers as Record<string, string>)['Content-Type']) {
        (init.headers as Record<string, string>)['Content-Type'] = 'application/json';
      }
    }

    const res = await fetch(`${this.apiBase}${path}`, init);

    if (res.status === 401) {
      if (this.onUnauthorized) {
        this.onUnauthorized();
      }
      return;
    }

    const contentType = res.headers.get('Content-Type') || '';
    const isJson = contentType.includes('application/json');
    const data = isJson ? await res.json().catch(() => null) : await res.text();

    if (!res.ok) {
      const message =
        isJson && (data as any)?.error ? String((data as any).error) : typeof data === 'string' ? data : 'Request failed';
      const error = new Error(message) as Error & { status: number; data: unknown };
      error.status = res.status;
      error.data = data;
      throw error;
    }

    return data;
  }

  get(path: string, options?: RequestInit): Promise<any> {
    return this.request(path, { ...options, method: 'GET' });
  }

  post(path: string, body?: unknown, options?: RequestInit): Promise<any> {
    return this.request(path, { ...options, method: 'POST', body: body as any });
  }

  put(path: string, body?: unknown, options?: RequestInit): Promise<any> {
    return this.request(path, { ...options, method: 'PUT', body: body as any });
  }

  delete(path: string, options: RequestInit & { body?: unknown } = {}): Promise<any> {
    return this.request(path, { ...options, method: 'DELETE' });
  }
}

/**
 * Create an HTTP client instance
 */
export function createHttpClient(config: HttpClientConfig): HttpClient {
  return new HttpClient(config);
}

