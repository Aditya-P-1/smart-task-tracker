export type ApiResponse<TData> = {
  data: TData;
  message: string;
  success: boolean;
};
