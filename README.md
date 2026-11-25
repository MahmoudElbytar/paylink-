# PayLink

Bill-payment and wallet backend (NestJS + PostgreSQL). Phase 1 foundation.

## Run it

```bash
docker compose up --build        # app on http://localhost:3000, health at /health
curl http://localhost:3000/health
```

## Develop

```bash
npm ci
npm run lint && npm run test:cov && npm run build
```

## Documentation

- `docs/requirements.md` – requirements pack
- `docs/design/` – Mermaid sources (use case, class, sequences, state, ER)
- `docs/prompt-log.md` – AI prompt log
- `docs/repo-rules.md` – branch protection and pull request rules
- `db/migrations/` – schema migrations (run automatically by compose on first start)

## Stack

Node.js 22, NestJS 10, TypeScript, PostgreSQL 16, Jest, ESLint, Docker Compose, GitHub Actions.

## Team

Add your names and roles here.
