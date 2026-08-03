import { listenToHost, postToHost } from "./origin-handshake";

const ORIGIN = "https://photos.example.test";
const ASSERTION = "a".repeat(80);

describe("origin handshake", () => {
  const originalParent = Object.getOwnPropertyDescriptor(window, "parent");
  let parentWindow: Window;

  beforeEach(() => {
    const iframe = document.createElement("iframe");
    document.body.append(iframe);
    if (!iframe.contentWindow) throw new Error("Fenêtre iframe indisponible dans jsdom");
    parentWindow = iframe.contentWindow;
    Object.defineProperty(window, "parent", { configurable: true, value: parentWindow });
  });

  afterEach(() => {
    document.body.replaceChildren();
    if (originalParent) Object.defineProperty(window, "parent", originalParent);
  });

  it("publie uniquement vers l'origine hôte explicite", () => {
    const postMessage = jest.spyOn(parentWindow, "postMessage").mockImplementation(() => undefined);

    postToHost(ORIGIN, { type: "READY" });

    expect(postMessage).toHaveBeenCalledWith({ type: "READY" }, ORIGIN);
  });

  it("accepte une assertion valide de la fenêtre parente et retire son listener", () => {
    const onAssertion = jest.fn<void, [string]>();
    const stop = listenToHost(ORIGIN, onAssertion);

    window.dispatchEvent(
      new MessageEvent("message", {
        origin: ORIGIN,
        source: parentWindow,
        data: { type: "IDENTITY_ASSERTION", assertion: ASSERTION },
      }),
    );
    expect(onAssertion).toHaveBeenCalledWith(ASSERTION);

    stop();
    window.dispatchEvent(
      new MessageEvent("message", {
        origin: ORIGIN,
        source: parentWindow,
        data: { type: "IDENTITY_ASSERTION", assertion: ASSERTION },
      }),
    );
    expect(onAssertion).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["https://evil.example", "parent", { type: "IDENTITY_ASSERTION", assertion: ASSERTION }],
    [ORIGIN, "other", { type: "IDENTITY_ASSERTION", assertion: ASSERTION }],
    [ORIGIN, "parent", { type: "IDENTITY_ASSERTION", assertion: "short" }],
    [ORIGIN, "parent", { type: "OPEN_PORTAL", assertion: ASSERTION }],
  ] as const)("ignore origine, source ou charge hostile", (origin, source, data) => {
    const onAssertion = jest.fn<void, [string]>();
    const stop = listenToHost(ORIGIN, onAssertion);

    window.dispatchEvent(
      new MessageEvent("message", {
        origin,
        source: source === "parent" ? parentWindow : window,
        data,
      }),
    );

    expect(onAssertion).not.toHaveBeenCalled();
    stop();
  });
});
