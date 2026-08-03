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

Le portail est disponible sur `http://localhost:3000` (`http://localhost:3005` pendant les E2E). Renseigner dans `.env.local` une clé d’intégration publique
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

Le polling reste le fallback autoritatif lorsque Socket.IO est indisponible. Le déploiement Compose expose le portail
sur `http://support.localhost` et route `/socket.io` vers NestJS. En production, utiliser un domaine HTTPS dédié et
omettre `PUBLIC_COOKIE_SECURE=false`.

## Intégration du widget

Le chargeur est versionné et immuable. Remplacer le domaine et la clé publique :

```html
<script
  src="https://support.example.com/widget/v1/widget.js"
  data-integration-key="VOTRE_CLE_PUBLIQUE"
  integrity="sha384-ABBH+SmuZPZwx+l7Dsu7ZQdnChdPstXFtoE+QibbQj+DN+39fSZtj6k1TpyBEd4Q"
  crossorigin="anonymous"
  defer
></script>
```

Autoriser exactement `https://support.example.com` dans `script-src`, `frame-src` et `connect-src` de la CSP du site
hôte. La réponse du chargeur porte un CORS public uniquement parce que cet asset immuable ne contient aucun secret.
Après chaque modification du fichier versionné, publier une nouvelle version et recalculer le SHA-384 ; ne jamais
remplacer silencieusement `/widget/v1/widget.js` en production.

La version `v2` accepte aussi `data-label` et `data-position="left|right"`. Son intégrité est documentée dans le
README du connecteur WordPress, qui épingle cette version au lieu de modifier `v1`.
