# Hasura setup

This folder is a placeholder for Hasura metadata and migrations.

- metadata/ contains metadata export
- migrations/ contains Postgres migrations

Configure Hasura CLI with environment variables:

- HASURA_GRAPHQL_ENDPOINT
- HASURA_GRAPHQL_ADMIN_SECRET
- HASURA_DATABASE_URL

Apply migrations + metadata:

- pnpm run hasura:apply

Env templates:

- Copy hasura/.env.example to hasura/.env
