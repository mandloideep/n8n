import { request } from "./api-caller";
import { CredentialSchema, DeleteResponseSchema, paginated } from "@/lib/schemas";
import type { Credential, CredentialCreate } from "@/types/workflow";

const PaginatedCredentialSchema = paginated(CredentialSchema);
export type CredentialsPage = {
  items: Credential[];
  total: number;
  limit: number;
  offset: number;
};

export const getCredentials = async (limit = 50, offset = 0): Promise<Credential[]> => {
  const data = await request(PaginatedCredentialSchema, {
    method: "GET",
    url: "/credential/credential",
    params: { limit, offset },
  });
  return data.items as Credential[];
};

export const getCredentialsPage = async (limit = 20, offset = 0): Promise<CredentialsPage> => {
  const data = await request(PaginatedCredentialSchema, {
    method: "GET",
    url: "/credential/credential",
    params: { limit, offset },
  });
  return data as CredentialsPage;
};

export const getCredential = async (id: number): Promise<Credential> => {
  const data = await request(CredentialSchema, {
    method: "GET",
    url: `/credential/credential/${id}`,
  });
  return data as Credential;
};

export const createCredential = async (credential: CredentialCreate): Promise<Credential> => {
  const data = await request(CredentialSchema, {
    method: "POST",
    url: "/credential/credential",
    data: credential,
  });
  return data as Credential;
};

export const deleteCredential = async (id: number): Promise<void> => {
  await request(DeleteResponseSchema, {
    method: "DELETE",
    url: `/credential/credential/${id}`,
  });
};

export const getCredentialsByPlatform = async (platform: string): Promise<Credential[]> => {
  const all = await getCredentials();
  return all.filter((c) => c.platform === platform);
};
