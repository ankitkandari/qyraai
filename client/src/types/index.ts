// User related types
export interface User {
  user_id: string;
  client_id: string;
  email: string;
  name: string;
  onboarded: boolean;
  created_at: string;
  company_name?: string;
  website?: string;
  use_case?: string;
  onboarded_at?: string;
}

export interface UserStatus {
  user_id: string;
  client_id: string;
  email: string;
  name: string;
  onboarded: boolean;
  created_at: string;
}

// Onboarding related types
export interface OnboardingData {
  user_id: string;
  company_name?: string;
  website?: string;
  use_case?: string;
}
export interface OnboardingFormData{
  company_name: string;
  website: string;
  use_case: string;
}

export interface OnboardingResponse {
  client_id: string;
  message: string;
  success: boolean;
}

// Client configuration types
export interface ClientTheme {
  primary_color: string;
  background_color: string;
  text_color: string;
}

export interface ClientConfig {
  client_id: string;
  name: string;
  theme: ClientTheme;
  welcome_message: string;
  enabled: boolean;
  rate_limit: number;
}

// Analytics types
// export interface AnalyticsData {
//   total_messages: number;
//   unique_sessions: number;
//   avg_response_time: number;
//   last_24h_messages: number;
//   files_uploaded: number;
//   chunks_stored: number;
//   daily_messages: Array<{
//     date: string;
//     messages: number;
//   }>;
//   top_sessions: Array<{
//     session_id: string;
//     message_count: number;
//   }>;
//   summary: {
//     total_interactions: number;
//     avg_session_length: number;
//     knowledge_base_size: number;
//     files_processed: number;
//   };
//   performance: {
//     avg_response_time: number;
//     cache_hit_rate: number;
//   };
//   client_info: {
//     client_id: string;
//     user_name: string;
//     created_at: string;
//     onboarded: boolean;
//   };
//   last_updated: string;
// }

export interface AnalyticsData {
  total_messages: number;
  unique_sessions: number;
  avg_response_time: number;
  last_24h_messages: number;
  daily_activity: Array<{ date: string; messages: number }>;
  response_time_trend: Array<{
    date: string;
    avg_response_time: number;
    target: number;
  }>;
  recent_activity: Array<{
    session_id: string;
    message_count: number;
    avg_response_time: number;
    last_activity: string;
    duration_minutes: number;
  }>;
  total_interactions: number;
  knowledge_base_size: number;
  cache_efficiency: number;
  avg_messages_per_session: number;
  avg_response_time_per_session: number;
  total_files: number;
  total_chunks: number;
  files_list: Array<{
    file_id: string;
    filename: string;
    size: number;
    num_pages: number;
    uploaded_at: string;
    chunk_count: number;
  }>;
  peak_activity_day?: string;
  busiest_hour?: string;
  avg_session_duration: number;
  last_updated: string;
}

export interface SessionAnalytics {
  total_sessions: number;
  sessions: Array<{
    session_id: string;
    message_count: number;
    first_message: string;
    last_message: string;
    avg_response_time: number;
  }>;
}

export interface KnowledgeBaseAnalytics {
  total_chunks: number;
  total_files: number;
  files: Array<{
    filename: string;
    chunk_count: number;
    file_size: number;
    num_pages: number;
    uploaded_at: string;
  }>;
  avg_chunks_per_file: number;
}

// Loading states
export interface LoadingState {
  isLoading: boolean;
  error: string | null;
}

// Use case options for onboarding
export const USE_CASE_OPTIONS = [
  { value: "customer_support", label: "Customer Support" },
  { value: "lead_generation", label: "Lead Generation" },
  { value: "faq", label: "FAQ Assistant" },
  { value: "product_info", label: "Product Information" },
  { value: "booking", label: "Appointment Booking" },
  { value: "other", label: "Other" },
] as const;

export type UseCaseValue = (typeof USE_CASE_OPTIONS)[number]["value"];

export interface UploadResult {
  filename: string;
  status: "success" | "error";
  message?: string;
  file_id?: string;
  chunks_count?: number;
  pages?: number;
  file_size?: number;
}

export interface MultipleUploadResponse {
  message: string;
  total_chunks_added: number;
  results: UploadResult[];
}

// File management interfaces
export interface FileInfo {
  filename: string;
  file_id: string;
  chunk_count: number;
  file_size: number;
  num_pages: number;
  uploaded_at: string;
}

export interface FilesResponse {
  files: FileInfo[];
  total_files: number;
  total_chunks: number;
}

// Updated PDFUploadResponse (keep existing for backward compatibility)
export interface PDFUploadResponse {
  message: string;
  filename: string;
  chunks_count: number;
  pages: number;
  file_size: number;
}
