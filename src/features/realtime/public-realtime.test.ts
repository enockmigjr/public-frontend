import { publicPollingInterval, publicRefreshSchema, realtimeQueryKeys } from "./public-realtime";

const ID = "0190f2a8-7d32-7000-8000-000000000001";

describe("temps réel public", () => {
  it("rejette les événements non publics ou mal formés", () => {
    expect(publicRefreshSchema.safeParse({ resource: "internal-note", id: ID }).success).toBe(false);
    expect(publicRefreshSchema.safeParse({ resource: "ticket", id: "not-an-id" }).success).toBe(false);
  });

  it("invalide les vues publiques concernées par un ticket", () => {
    expect(realtimeQueryKeys({ resource: "ticket", id: ID })).toEqual([
      ["public-tickets"],
      ["public-ticket", ID],
      ["public-timeline", ID],
      ["public-attachments", ID],
      ["widget-tickets"],
      ["widget-ticket", ID],
      ["widget-timeline", ID],
    ]);
  });

  it("rafraîchit toutes les pièces jointes sans exposer leur parent", () => {
    expect(realtimeQueryKeys({ resource: "attachment", id: ID })).toEqual([["public-attachments"]]);
  });

  it("désactive le polling connecté et borne le repli réseau", () => {
    expect(publicPollingInterval("connected", 0)).toBe(false);
    expect(publicPollingInterval("connecting", 0)).toBe(15_000);
    expect(publicPollingInterval("polling", 0)).toBe(15_000);
    expect(publicPollingInterval("polling", 10)).toBe(60_000);
  });
});
