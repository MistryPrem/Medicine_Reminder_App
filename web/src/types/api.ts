export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T;
  errorCode?: string;
  details?: Array<{ field: string; message: string }>;
}
