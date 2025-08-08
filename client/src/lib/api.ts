// api.ts
import axios, { AxiosError, AxiosInstance } from "axios";
import {
  UserStatus,
  OnboardingData,
  OnboardingResponse,
  ClientConfig,
  AnalyticsData,
  PDFUploadResponse,
  SessionAnalytics,
  KnowledgeBaseAnalytics,
  MultipleUploadResponse,
  FileInfo,
} from "@/types";
import { useAuth } from "@clerk/nextjs";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

class ApiClient {
  private instance: AxiosInstance;
  private token: string | null = null;

  constructor() {
    this.instance = axios.create({
      baseURL: `${API_BASE_URL}`,
    });

    this.setupInterceptors();
  }

  public setToken(token: string | null): void {
    this.token = token;
  }

  private setupInterceptors() {
    // Request interceptor
    this.instance.interceptors.request.use(
      (config) => {
        if (this.token) {
          config.headers.Authorization = `Bearer ${this.token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.instance.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        const status = error.response?.status;
        const errorMessage = error.message || "An error occurred";

        switch (status) {
          case 401:
            console.error("Unauthorized - redirecting to login");
            break;
          case 403:
            console.error(
              "Forbidden - insufficient permissions:",
              errorMessage
            );
            break;
          case 404:
            console.error("Resource not found:", errorMessage);
            break;
          case 500:
            console.error("Server error:", errorMessage);
            break;
          default:
            console.error("API error:", errorMessage);
        }

        return Promise.reject(error);
      }
    );
  }

  // User methods
  async getStatus(): Promise<UserStatus | null> {
    try {
      const response = await this.instance.get<UserStatus>("/user/status");
      return response.data;
    } catch (error: any) {
      if ([403, 404].includes(error.response?.status)) {
        console.warn("User status not available:", error.message);
        return null;
      }
      throw error;
    }
  }

  // Onboarding methods
  async completeOnboarding(data: OnboardingData): Promise<OnboardingResponse> {
    const response = await this.instance.post<OnboardingResponse>(
      "/onboarding",
      data
    );
    return response.data;
  }

  // Config methods
  async getConfig(): Promise<ClientConfig> {
    const response = await this.instance.get<ClientConfig>("/config");
    return response.data;
  }

  async updateConfig(config: ClientConfig): Promise<ClientConfig> {
    const response = await this.instance.post<ClientConfig>("/config", config);
    return response.data;
  }

  // Analytics methods
  async getAnalytics(): Promise<AnalyticsData | null> {
    try {
      const response = await this.instance.get<AnalyticsData>(`/analytics`);
      return response.data;
    } catch (error: any) {
      if ([403, 404].includes(error.response?.status)) {
        console.warn(`Analytics not available`);
        return null;
      }
      throw error;
    }
  }

  async getAnalyticSessions(): Promise<SessionAnalytics | null> {
    try {
      const response = await this.instance.get<SessionAnalytics>(
        `/analytics/sessions`
      );
      return response.data;
    } catch (error: any) {
      if ([403, 404].includes(error.response?.status)) {
        console.warn(`Analytics session not available`);
        return null;
      }
      throw error;
    }
  }

  async getAnalyticKB(): Promise<KnowledgeBaseAnalytics | null> {
    try {
      const response = await this.instance.get<KnowledgeBaseAnalytics>(
        `/analytics/knowledge-base`
      );
      return response.data;
    } catch (error: any) {
      if ([403, 404].includes(error.response?.status)) {
        console.warn(`Analytics KB not available`);
        return null;
      }
      throw error;
    }
  }

  async getAnalyticExport(): Promise<Blob | null> {
    try {
      const response = await this.instance.get("/analytics/export", {
        responseType: "blob",
      });

      return response.data as Blob;
    } catch (error: any) {
      if ([403, 404].includes(error.response?.status)) {
        console.warn("Analytics export failed:", error.response?.statusText);
        return null;
      }

      console.error("Unexpected error during analytics export:", error);
      throw error;
    }
  }

  // File methods
  async uploadPDF(formData: FormData): Promise<PDFUploadResponse> {
    const response = await this.instance.post<PDFUploadResponse>(
      "/upload",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  }

  async uploadMultiplePDFs(
    formData: FormData
  ): Promise<MultipleUploadResponse> {
    const response = await this.instance.post<MultipleUploadResponse>(
      "/upload/multiple",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        timeout: 60000,
      }
    );
    return response.data;
  }

  async getFiles(): Promise<{
    files: FileInfo[];
    total_files: number;
    total_chunks: number;
  }> {
    const response = await this.instance.get("/files");
    return response.data;
  }

  async deleteFile(filename: string): Promise<{ message: string }> {
    const encodedFilename = encodeURIComponent(filename);
    const response = await this.instance.delete(`/files/${encodedFilename}`);
    return response.data;
  }
}

export const api = new ApiClient();

export const useApi = () => {
  const { getToken } = useAuth();

  const initialize = async () => {
    const token = await getToken();
    api.setToken(token);
  };

  return {
    // User methods
    getStatus: async () => {
      await initialize();
      return api.getStatus();
    },

    // Onboarding methods
    completeOnboarding: async (data: OnboardingData) => {
      await initialize();
      return api.completeOnboarding(data);
    },

    // Config methods
    getConfig: async () => {
      await initialize();
      return api.getConfig();
    },
    updateConfig: async (config: ClientConfig) => {
      await initialize();
      return api.updateConfig(config);
    },

    // Analytics methods
    getAnalytics: async () => {
      await initialize();
      return api.getAnalytics();
    },

    getAnalyticSessions: async () => {
      await initialize();
      return api.getAnalyticSessions();
    },

    getAnalyticKB: async () => {
      await initialize();
      return api.getAnalyticKB();
    },

    getAnalyticExport: async () => {
      await initialize();
      return api.getAnalyticExport();
    },

    // File methods
    uploadPDF: async (formData: FormData) => {
      await initialize();
      return api.uploadPDF(formData);
    },

    uploadMultiplePDFs: async (formData: FormData) => {
      await initialize();
      return api.uploadMultiplePDFs(formData);
    },

    getFiles: async () => {
      await initialize();
      return api.getFiles();
    },

    deleteFile: async (filename: string) => {
      await initialize();
      return api.deleteFile(filename);
    },
  };
};
