import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

describe("contrat OpenAPI public", () => {
  it("correspond au hash approuvé par le backend", async () => {
    const contractPath = resolve(process.cwd(), "contracts/openapi.public.json");
    const expectedPath = resolve(process.cwd(), "contracts/openapi.public.sha256");
    const [contract, expected] = await Promise.all([readFile(contractPath), readFile(expectedPath, "utf8")]);
    const actual = createHash("sha256").update(contract).digest("hex");

    expect(actual.toUpperCase()).toBe(expected.trim().toUpperCase());
  });
});
