# Heirloom Backend

Fastify orchestration layer for Privado ID verification, Hasura admin mutations, and on-chain allowlisting.

## Environment variables

- PORT (default 3001)
- HOST (default 0.0.0.0)
- HASURA_GRAPHQL_ENDPOINT
- HASURA_GRAPHQL_ADMIN_SECRET
- PRIVADO_DEV_MODE (set true for local stubbed verification)
- PRIVADO_CALLBACK_URL
- PRIVADO_VERIFIER_DID
- PRIVADO_REQUEST_REASON (optional)
- PRIVADO_REQUEST_SCOPE_JSON (optional JSON array/object for proof requests)
- PRIVADO_REQUEST_TTL_MS (optional)
- PRIVADO_ACCEPTED_DELAY_MS (optional)
- PRIVADO_CIRCUITS_DIR (default ./circuits)
- PRIVADO_IPFS_GATEWAY_URL (default https://ipfs.io)
- PRIVADO_RESOLVER_PREFIX (default polygon:amoy)
- PRIVADO_RPC_URL
- PRIVADO_STATE_CONTRACT_ADDRESS (default Amoy state contract)
- CHAIN_VERIFY_DISABLED (set true to skip allowlisting)
- CHAIN_RPC_URL
- CHAIN_PRIVATE_KEY
- CHAIN_CONTRACT_ADDRESS
- CHAIN_CONTRACT_ABI (optional JSON array)
