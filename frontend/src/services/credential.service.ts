import { apiCaller } from "./api-caller";
import { Credential, CredentialCreate } from "@/types/workflow";

interface Paginated<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

export const getCredentials = async (limit = 50, offset = 0): Promise<Credential[]> => {
  const response = await apiCaller.get<Paginated<Credential>>("/credential/credential", {
    params: { limit, offset },
  });
  if (response.status !== 200) {
    throw new Error((response.data as any)?.detail || "Failed to fetch credentials");
  }
  return response.data.items;
};

export const getCredential = async (id: number): Promise<Credential> => {
  const response = await apiCaller.get<Credential>(`/credential/credential/${id}`);
  if (response.status !== 200) {
    throw new Error((response.data as any)?.detail || "Failed to fetch credential");
  }
  return response.data;
};

export const createCredential = async (credential: CredentialCreate): Promise<Credential> => {
  const response = await apiCaller.post<Credential>("/credential/credential", credential);
  if (response.status !== 200) {
    throw new Error((response.data as any)?.detail || "Failed to create credential");
  }
  return response.data;
};

export const deleteCredential = async (id: number): Promise<void> => {
  const response = await apiCaller.delete(`/credential/credential/${id}`);
  if (response.status !== 200) {
    throw new Error((response.data as any)?.detail || "Failed to delete credential");
  }
};

export const getCredentialsByPlatform = async (platform: string): Promise<Credential[]> => {
  const all = await getCredentials();
  return all.filter((c) => c.platform === platform);
};
