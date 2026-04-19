const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public details?: string[],
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  private async handleResponse<T>(res: Response): Promise<T> {
    if (res.ok) return res.json()

    let message = `Request failed: ${res.status}`
    let details: string[] | undefined

    try {
      const body = await res.json()
      if (Array.isArray(body.message)) {
        message = body.message[0]
        details = body.message
      } else if (typeof body.message === 'string') {
        message = body.message
      }
    } catch {
      // Response body is not JSON
    }

    throw new ApiError(res.status, message, details)
  }

  async get<T>(path: string): Promise<T> {
    const res = await fetch(`${this.baseUrl}/api${path}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    })
    return this.handleResponse<T>(res)
  }

  async post<T>(path: string, body?: unknown): Promise<T> {
    const res = await fetch(`${this.baseUrl}/api${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: body ? JSON.stringify(body) : undefined,
    })
    return this.handleResponse<T>(res)
  }

  async delete<T>(path: string): Promise<T> {
    const res = await fetch(`${this.baseUrl}/api${path}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    })
    return this.handleResponse<T>(res)
  }

  getUrl(path: string): string {
    return `${this.baseUrl}/api${path}`
  }
}

export const apiClient = new ApiClient(API_URL)
