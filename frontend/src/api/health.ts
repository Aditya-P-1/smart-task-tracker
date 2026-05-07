import { apiClient } from './client';

export type HealthResponse = {
  message: string;
  status: string;
};

export async function checkApiHealth() {
  const response = await apiClient.get<HealthResponse>('/health');
  return response.data;
}
