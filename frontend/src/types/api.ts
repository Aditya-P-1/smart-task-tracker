export type ApiResponse<TData> = {
  code?: string;
  data: TData;
  message: string;
  success: boolean;
};
