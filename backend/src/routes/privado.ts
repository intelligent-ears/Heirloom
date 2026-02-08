import type { FastifyInstance, FastifyPluginOptions } from "fastify";
import { PrivadoService } from "../services/privado.service.js";
import { HasuraService } from "../services/hasura.service.js";
import { ChainService } from "../services/chain.service.js";

type StartRequest = {
  walletAddress?: string;
};

type VerifyRequest = {
  requestId: string;
  walletAddress: string;
  nullifierHash: string;
  proof: unknown;
  did?: string;
  credentialHash?: string;
};

export default async function privadoRoutes(
  fastify: FastifyInstance,
  _opts: FastifyPluginOptions
) {
  const privadoService = new PrivadoService();
  const hasuraService = new HasuraService();
  const chainService = new ChainService();

  fastify.post<{ Body: StartRequest }>("/start", async (request, reply) => {
    const result = await privadoService.startVerification({
      walletAddress: request.body?.walletAddress,
    });

    return reply.code(200).send(result);
  });

  fastify.post<{ Body: VerifyRequest }>("/verify", async (request, reply) => {
    const { requestId, walletAddress, nullifierHash, proof, did, credentialHash } =
      request.body ?? {};

    if (!requestId || !walletAddress || !nullifierHash || !proof) {
      return reply.code(400).send({
        error: "requestId, walletAddress, nullifierHash, and proof are required",
      });
    }

    const verification = await privadoService.verifyProof({
      requestId,
      proof,
      nullifierHash,
      did,
      credentialHash,
    });

    const resolvedDid = verification.did ?? did;
    const resolvedCredentialHash =
      verification.credentialHash ?? credentialHash;

    if (!resolvedDid || !resolvedCredentialHash) {
      return reply.code(400).send({
        error: "did and credentialHash are required",
      });
    }

    const nullifierExists = await hasuraService.checkNullifierExists(
      nullifierHash
    );

    if (nullifierExists) {
      return reply.code(409).send({ error: "Identity already used" });
    }

    await hasuraService.insertNullifier(nullifierHash);

    try {
      const user = await hasuraService.insertUser({
        walletAddress,
        did: resolvedDid,
        credentialHash: resolvedCredentialHash,
      });

      await chainService.verifyUser(walletAddress);

      return reply.code(200).send({ ok: true, user });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";

      if (message.toLowerCase().includes("unique")) {
        return reply.code(409).send({ error: "Wallet or identity already used" });
      }

      throw error;
    }
  });

}
