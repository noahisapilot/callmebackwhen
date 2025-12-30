import type {
  SendOtpRequest,
  SendOtpResponse,
  VerifyOtpRequest,
  VerifyOtpResponse,
  GetMeResponse,
  CreateCallRequest,
  CreateCallResponse,
  ListCallsResponse,
  GetCallResponse,
  GetActiveCallResponse,
  CancelCallResponse,
  ApiError,
} from '@callmebackwhen/shared';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4566';

const TOKEN_KEY = 'auth_token';

class ApiClient {
  private getToken(): string | null {
    // Read directly from localStorage to survive hot module reloads
    if (typeof window !== 'undefined') {
      return localStorage.getItem(TOKEN_KEY);
    }
    return null;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const token = this.getToken();
    if (token) {
      (headers as Record<string, string>).Authorization = `Bearer ${token}`;
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

  // Call endpoints
  async createCall(data: CreateCallRequest): Promise<CreateCallResponse> {
    return this.request('/calls', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async listCalls(page = 1, limit = 20): Promise<ListCallsResponse> {
    return this.request(`/calls?page=${page}&limit=${limit}`);
  }

  async getCall(id: string): Promise<GetCallResponse> {
    return this.request(`/calls/${id}`);
  }

  async getActiveCall(): Promise<GetActiveCallResponse> {
    return this.request('/calls/active');
  }

  async cancelCall(id: string): Promise<CancelCallResponse> {
    return this.request(`/calls/${id}/cancel`, {
      method: 'POST',
    });
  }

  // SSE stream URL (uses Lambda Function URL)
  getCallStreamUrl(callId: string): string {
    const streamUrl = process.env.NEXT_PUBLIC_CALL_STREAM_URL ?? '';
    return `${streamUrl}?callId=${callId}`;
  }
}

export const api = new ApiClient();
