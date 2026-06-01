import { describe, it, expect, mock } from "bun:test";
import { createLogger } from "../util";

describe("createLogger()", () => {
  function makeClient() {
    const logMock = mock(async () => {});
    const client = { app: { log: logMock } } as any;
    return { client, logMock };
  }

  it("calls client.app.log with correct service and level for debug", async () => {
    const { client, logMock } = makeClient();
    const log = createLogger(client, "my-service");
    log.debug("hello", { key: "val" });
    // fire-and-forget — flush microtasks
    await Promise.resolve();
    expect(logMock).toHaveBeenCalledTimes(1);
    const call = (logMock.mock.calls as any)[0][0];
    expect(call.body.service).toBe("my-service");
    expect(call.body.level).toBe("debug");
    expect(call.body.message).toBe("hello");
    expect(call.body.extra.data).toEqual({ key: "val" });
  });

  it("calls client.app.log with level info", async () => {
    const { client, logMock } = makeClient();
    const log = createLogger(client, "svc");
    log.info("info msg");
    await Promise.resolve();
    expect((logMock.mock.calls as any)[0][0].body.level).toBe("info");
  });

  it("calls client.app.log with level warn", async () => {
    const { client, logMock } = makeClient();
    const log = createLogger(client, "svc");
    log.warn("warn msg");
    await Promise.resolve();
    expect((logMock.mock.calls as any)[0][0].body.level).toBe("warn");
  });

  it("calls client.app.log with level error", async () => {
    const { client, logMock } = makeClient();
    const log = createLogger(client, "svc");
    log.error("err msg");
    await Promise.resolve();
    expect((logMock.mock.calls as any)[0][0].body.level).toBe("error");
  });

  it("omits extra.data when no data argument given", async () => {
    const { client, logMock } = makeClient();
    const log = createLogger(client, "svc");
    log.debug("no data");
    await Promise.resolve();
    expect((logMock.mock.calls as any)[0][0].body.extra).toEqual({});
  });

  it("does not throw when client.app.log rejects", async () => {
    const client = { app: { log: mock(async () => { throw new Error("fail"); }) } } as any;
    const log = createLogger(client, "svc");
    expect(() => log.debug("msg")).not.toThrow();
    await new Promise(r => setTimeout(r, 10)); // let rejection be handled
  });
});
