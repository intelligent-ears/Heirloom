type GraphQLResponse<T> = {
  data?: T;
  errors?: Array<{ message: string }>;
};

type InsertUserInput = {
  walletAddress: string;
  did: string;
  credentialHash: string;
};

type InsertUserResult = {
  insert_users_one: {
    id: string;
    wallet_address: string;
    did: string;
    credential_hash: string;
  };
};

type NullifierByPkResult = {
  identity_nullifiers_by_pk: {
    nullifier_hash: string;
  } | null;
};

export class HasuraService {
  private readonly endpoint = process.env.HASURA_GRAPHQL_ENDPOINT ?? "";
  private readonly adminSecret =
    process.env.HASURA_GRAPHQL_ADMIN_SECRET ?? "";

  private async request<T>(query: string, variables?: Record<string, unknown>) {
    if (!this.endpoint || !this.adminSecret) {
      throw new Error("Hasura admin endpoint/secret not configured");
    }

    const response = await fetch(this.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-hasura-admin-secret": this.adminSecret,
      },
      body: JSON.stringify({ query, variables }),
    });

    const json = (await response.json()) as GraphQLResponse<T>;

    if (json.errors?.length) {
      throw new Error(json.errors.map((err) => err.message).join("; "));
    }

    if (!json.data) {
      throw new Error("Hasura response missing data");
    }

    return json.data;
  }

  async checkNullifierExists(nullifierHash: string) {
    const query = `query CheckNullifier($nullifier_hash: String!) {\n  identity_nullifiers_by_pk(nullifier_hash: $nullifier_hash) {\n    nullifier_hash\n  }\n}`;

    const data = await this.request<NullifierByPkResult>(query, {
      nullifier_hash: nullifierHash,
    });

    return Boolean(data.identity_nullifiers_by_pk);
  }

  async insertNullifier(nullifierHash: string) {
    const mutation = `mutation InsertNullifier($nullifier_hash: String!, $created_at: timestamptz!) {\n  insert_identity_nullifiers_one(object: { nullifier_hash: $nullifier_hash, created_at: $created_at }) {\n    nullifier_hash\n  }\n}`;

    await this.request(mutation, {
      nullifier_hash: nullifierHash,
      created_at: new Date().toISOString(),
    });
  }

  async insertUser(input: InsertUserInput) {
    const mutation = `mutation InsertUser($wallet_address: String!, $did: String!, $credential_hash: String!, $created_at: timestamptz!) {\n  insert_users_one(object: { wallet_address: $wallet_address, did: $did, credential_hash: $credential_hash, created_at: $created_at }) {\n    id\n    wallet_address\n    did\n    credential_hash\n  }\n}`;

    const data = await this.request<InsertUserResult>(mutation, {
      wallet_address: input.walletAddress,
      did: input.did,
      credential_hash: input.credentialHash,
      created_at: new Date().toISOString(),
    });

    return data.insert_users_one;
  }
}
