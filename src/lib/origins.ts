/** Mode développement local HTTP (le cookie sécurisé n'est pas exigé). */
export function isLocalDev(): boolean {
  return process.env.PUBLIC_COOKIE_SECURE !== "true";
}

/**
 * Origine locale autorisée en repli de développement : localhost, IPv4 privé
 * (10/8, 172.16/12, 192.168/16) et loopback. Hors production, le CSP du widget
 * accepte uniquement ces origines ; les intégrations réelles passent par la
 * liste d'origines du backend.
 */
export function isLocalDevOrigin(origin: string): boolean {
  try {
    const url = new URL(origin);
    if (url.origin !== origin || !["http:", "https:"].includes(url.protocol)) return false;
    const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, "").replace(/^::ffff:/, "");
    if (host === "localhost" || host === "::1") return true;
    if (!/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return false;
    const [a, b] = host.split(".").map(Number);
    if ([a, b, Number(host.split(".")[2]), Number(host.split(".")[3])].some((part) => part > 255)) return false;
    return a === 10 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || a === 127;
  } catch {
    return false;
  }
}
