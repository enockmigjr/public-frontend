import { supportContext } from "./support-context";

describe("supportContext", () => {
  it.each([
    ["portal", "portal"],
    ["widget", "widget"],
  ] as const)("conserve le contexte %s", (header, expected) => {
    expect(supportContext(header)).toBe(expected);
  });

  it.each([null, "", "admin", "WIDGET"])("revient au portail pour %p", (header) => {
    expect(supportContext(header)).toBe("portal");
  });
});
