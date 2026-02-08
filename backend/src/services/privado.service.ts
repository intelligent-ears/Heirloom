import { createHash, randomUUID } from "crypto";
import path from "path";
import type { protocol } from "@iden3/js-iden3-auth";

type StartVerificationInput = {
  walletAddress?: string;
};

type VerifyProofInput = {
  requestId: string;
  proof: unknown;
  nullifierHash: string;
  did?: string;
  credentialHash?: string;
};

type VerifyProofResult = {
  did?: string;
  credentialHash?: string;
};

type StoredRequest = {
  request: protocol.AuthorizationRequestMessage | Record<string, unknown>;
  createdAt: number;
};

const requestStore = new Map<string, StoredRequest>();

const DEFAULT_REQUEST_TTL_MS = 10 * 60 * 1000;

export class PrivadoService {
  private readonly devMode = process.env.PRIVADO_DEV_MODE === "true";
  private readonly requestTtlMs = Number(
    process.env.PRIVADO_REQUEST_TTL_MS ?? DEFAULT_REQUEST_TTL_MS
  );
  private readonly verifierDid = process.env.PRIVADO_VERIFIER_DID ?? "";
  private readonly callbackUrl = process.env.PRIVADO_CALLBACK_URL ?? "";
  private readonly requestReason =
    process.env.PRIVADO_REQUEST_REASON ?? "Heirloom verification";
  private readonly circuitsDir =
    process.env.PRIVADO_CIRCUITS_DIR ??
    path.join(process.cwd(), "circuits");
  private readonly ipfsGateway =
    process.env.PRIVADO_IPFS_GATEWAY_URL ?? "https://ipfs.io";
  private readonly resolverPrefix =
    process.env.PRIVADO_RESOLVER_PREFIX ?? "polygon:amoy";
  private readonly rpcUrl = process.env.PRIVADO_RPC_URL ?? "";
  private readonly stateContract =
    process.env.PRIVADO_STATE_CONTRACT_ADDRESS ??
    "0x1a4cC30f2aA0377b0c3bc9848766D90cb4404124";
  private verifierPromise?: Promise<unknown>;

  async startVerification(input: StartVerificationInput) {
    const requestId = randomUUID();
    const nonce = randomUUID();

    if (this.devMode) {
      const request = {
        nonce,
        callbackUrl: this.callbackUrl,
        walletAddress: input.walletAddress,
      };

      requestStore.set(requestId, { request, createdAt: Date.now() });
      this.cleanupExpiredRequests();

      return { requestId, request };
    }

    if (!this.verifierDid || !this.callbackUrl) {
      throw new Error("Privado verifier DID or callback URL not configured");
    }

    const callback = new URL(this.callbackUrl);
    callback.searchParams.set("sessionId", requestId);

    const { auth } = await import("@iden3/js-iden3-auth");
    const request = auth.createAuthorizationRequest(
      this.requestReason,
      this.verifierDid,
      callback.toString()
    );

    const scope = this.parseScopeFromEnv();
    if (scope.length) {
      request.body.scope = [...(request.body.scope ?? []), ...scope];
    }

    request.body.reason = this.requestReason;
    request.body.message = input.walletAddress
      ? `Wallet verification for ${input.walletAddress}`
      : request.body.message;

    requestStore.set(requestId, { request, createdAt: Date.now() });
    this.cleanupExpiredRequests();

    return {
      requestId,
      request,
    };
  }

  async verifyProof(input: VerifyProofInput): Promise<VerifyProofResult> {
    if (this.devMode) {
      return {
        did: input.did ?? "did:privado:dev",
        credentialHash: input.credentialHash ?? this.hashProof(input.proof),
      };
    }

    const tokenStr = this.extractProofToken(input.proof);
    const stored = requestStore.get(input.requestId);

    if (!stored) {
      throw new Error("Unknown or expired verification request");
    }

    this.ensureVerifierConfig();

    const verifier = await this.getVerifier();
    const options = {
      AcceptedStateTransitionDelay: Number(
        process.env.PRIVADO_ACCEPTED_DELAY_MS ?? 5 * 60 * 1000
      ),
    };

    const authResponse = await (verifier as { fullVerify: Function }).fullVerify(
      tokenStr,
      stored.request,
      options
    );

    const resolvedDid =
      (authResponse as { from?: string }).from ??
      (authResponse as { body?: { from?: string; subject?: string } }).body
        ?.from ??
      (authResponse as { body?: { subject?: string } }).body?.subject;

    return {
      did: resolvedDid ?? input.did,
      credentialHash: input.credentialHash ?? this.hashProof(tokenStr),
    };
  }

  private ensureVerifierConfig() {
    if (!this.rpcUrl || !this.resolverPrefix) {
      throw new Error("Privado verifier RPC configuration missing");
    }

    if (!this.stateContract) {
      throw new Error("Privado state contract address missing");
    }
  }

  private async getVerifier() {
    if (!this.verifierPromise) {
      const { auth, resolver } = await import("@iden3/js-iden3-auth");

      const resolvers = {
        [this.resolverPrefix]: new resolver.EthStateResolver(
          this.rpcUrl,
          this.stateContract
        ),
      };

      this.verifierPromise = auth.Verifier.newVerifier({
        stateResolver: resolvers,
        circuitsDir: this.circuitsDir,
        ipfsGatewayURL: this.ipfsGateway,
      });
    }

    return this.verifierPromise;
  }

  private parseScopeFromEnv(): protocol.ZeroKnowledgeProofRequest[] {
    const scopeJson = process.env.PRIVADO_REQUEST_SCOPE_JSON;
    if (!scopeJson) {
      return [];
    }

    try {
      const parsed = JSON.parse(scopeJson);
      if (Array.isArray(parsed)) {
        return parsed as protocol.ZeroKnowledgeProofRequest[];
      }
      return [parsed as protocol.ZeroKnowledgeProofRequest];
    } catch {
      throw new Error("Invalid PRIVADO_REQUEST_SCOPE_JSON");
    }
  }

  private cleanupExpiredRequests() {
    const now = Date.now();
    for (const [key, value] of requestStore.entries()) {
      if (now - value.createdAt > this.requestTtlMs) {
        requestStore.delete(key);
      }
    }
  }

  private extractProofToken(proof: unknown) {
    if (typeof proof === "string") {
      return proof;
    }

    if (proof && typeof proof === "object") {
      const candidate = (proof as Record<string, unknown>).token ??
        (proof as Record<string, unknown>).jwz ??
        (proof as Record<string, unknown>).jwt ??
        (proof as Record<string, unknown>).proof;

      if (typeof candidate === "string") {
        return candidate;
      }
    }

    throw new Error("Invalid proof format; expected JWZ string");
  }

  private hashProof(proof: unknown) {
    const tokenStr = typeof proof === "string" ? proof : JSON.stringify(proof);
    return createHash("sha256").update(tokenStr).digest("hex");
  }
}
