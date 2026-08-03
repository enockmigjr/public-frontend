import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

const [contract, expected] = await Promise.all([
  readFile(new URL("../contracts/openapi.public.json", import.meta.url)),
  readFile(new URL("../contracts/openapi.public.sha256", import.meta.url), "utf8"),
]);
const actual = createHash("sha256").update(contract).digest("hex").toUpperCase();
if (actual !== expected.trim().toUpperCase()) {
  throw new Error(`Contrat public altéré : hash attendu ${expected.trim()}, reçu ${actual}.`);
}
