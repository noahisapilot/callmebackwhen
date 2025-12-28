import type {
  SendOtpRequest,
  SendOtpResponse,
  VerifyOtpRequest,
  VerifyOtpResponse,
  GetMeResponse,
  ApiError,
} from '@callmebackwhen/shared';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4566';

class ApiClient {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      (headers as Record<string, string>).Authorization = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      const error = data as ApiError;
      throw new Error(error.error?.message ?? 'An error occurred');
    }

    return data as T;
  }

  // Auth endpoints
  async sendOtp(data: SendOtpRequest): Promise<SendOtpResponse> {
    return this.request('/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async verifyOtp(data: VerifyOtpRequest): Promise<VerifyOtpResponse> {
    return this.request('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async logout(): Promise<void> {
    await this.request('/auth/logout', {
      method: 'POST',
    });
  }

  // User endpoints
  async getMe(): Promise<GetMeResponse> {
    return this.request('/users/me');
  }
}

export const api = new ApiClient();
