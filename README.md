# Portail public d’assistance

Frontend public autonome du système de trouble tickets télécom. Il fournit un portail pleine page et un widget iframe
sans exposer de jeton au navigateur : toutes les opérations passent par un BFF Next.js même origine avec cookies
HttpOnly et protection CSRF.

## Démarrage local

Prérequis : Node.js 22+, pnpm 10, backend NestJS démarré et une intégration publique active.

```bash
Copy-Item .env.example .env.local
pnpm install --frozen-lockfile
pnpm dev
```

Le portail est disponible sur `http://localhost:3000`. Renseigner dans `.env.local` une clé d’intégration publique
réelle et un secret CSRF aléatoire d’au moins 32 caractères. Aucun secret ne doit être commité.

## Contrat et qualité

Seul le contrat public est embarqué dans `contracts/openapi.public.json`.

```bash
pnpm contract:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Le polling est le fallback autoritatif. Le temps réel navigateur, les E2E multi-navigateurs et le raccordement
Docker/Nginx sont suivis dans la phase 05 du plan backend avant activation sur un site tiers.
