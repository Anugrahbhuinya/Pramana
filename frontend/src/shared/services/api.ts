// src/shared/services/api.ts
import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from "axios";

// Define a standardized error response interface matching the backend
export interface ApiErrorPayload {
  code: string;
  message: string;
  details?: any;
}

export class AppError extends Error {
  code: string;
  status: number;
  details?: any;

  constructor(payload: ApiErrorPayload, status: number) {
    super(payload.message);
    this.name = "AppError";
    this.code = payload.code;
    this.status = status;
    this.details = payload.details;
  }
}

const API_BASE_URL =
  ((import.meta as any).env?.VITE_API_URL as string) || "http://localhost:8000/api/v1";

export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor (e.g. for telemetry, loading tracking, auth tokens)
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // We can inject global headers here if required
    return config;
  },
  (error: any) => {
    return Promise.reject(error);
  }
);

// Response interceptor for standardized error wrapping
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError) => {
    let errorPayload: ApiErrorPayload = {
      code: "UNKNOWN_ERROR",
      message: "An unexpected client error occurred.",
    };
    let status = 500;

    if (error.response) {
      status = error.response.status;
      const data = error.response.data as any;
      
      // Parse custom error schema from backend if available
      if (data && data.success === false && data.error) {
        errorPayload = data.error;
      } else if (data && data.detail) {
        // Handle FastAPI's standard HTTPException {detail: "..."} format
        errorPayload.message = typeof data.detail === "string" ? data.detail : JSON.stringify(data.detail);
        errorPayload.code = `HTTP_${status}`;
      } else if (data && typeof data === "string") {
        errorPayload.message = data;
      } else {
        errorPayload.message = error.message;
      }
    } else if (error.request) {
      // Request was made but no response received
      errorPayload = {
        code: "NETWORK_TIMEOUT",
        message: "Server is unreachable. Please verify your network connection.",
      };
    } else {
      errorPayload.message = error.message;
    }

    return Promise.reject(new AppError(errorPayload, status));
  }
);
