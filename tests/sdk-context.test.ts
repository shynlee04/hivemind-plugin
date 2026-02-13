import { describe, test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  initSdkContext,
  getClient,
  getShell,
  getServerUrl,
  getProject,
  resetSdkContext,
  isSdkAvailable,
  withClient
} from "../src/hooks/sdk-context.js";

describe("=== SDK Context Singleton Tests ===", () => {
  const mockClient = { session: {}, tui: {}, file: {}, find: {} } as any;
  const mockShell = (() => {}) as any;
  const mockServerUrl = new URL("http://localhost:3000");
  const mockProject = { id: "test", worktree: "/tmp", time: { created: Date.now() } } as any;

  beforeEach(() => {
    resetSdkContext();
  });

  describe("Initial State", () => {
    test("getClient returns null initially", () => {
      assert.equal(getClient(), null);
    });

    test("getShell returns null initially", () => {
      assert.equal(getShell(), null);
    });

    test("getServerUrl returns null initially", () => {
      assert.equal(getServerUrl(), null);
    });

    test("getProject returns null initially", () => {
      assert.equal(getProject(), null);
    });

    test("isSdkAvailable returns false initially", () => {
      assert.equal(isSdkAvailable(), false);
    });
  });

  describe("Initialization", () => {
    test("initSdkContext correctly sets all values", () => {
      initSdkContext({
        client: mockClient,
        $: mockShell,
        serverUrl: mockServerUrl,
        project: mockProject
      });

      assert.equal(getClient(), mockClient);
      assert.equal(getShell(), mockShell);
      assert.equal(getServerUrl(), mockServerUrl);
      assert.equal(getProject(), mockProject);
      assert.equal(isSdkAvailable(), true);
    });

    test("partial init handles nulls gracefully", () => {
      initSdkContext({
        client: mockClient,
        $: null as any,
        serverUrl: null as any,
        project: null as any
      });

      assert.equal(getClient(), mockClient);
      assert.equal(getShell(), null);
      assert.equal(getServerUrl(), null);
      assert.equal(getProject(), null);
      assert.equal(isSdkAvailable(), true);
    });
  });

  describe("Reset", () => {
    test("resetSdkContext restores everything to null", () => {
      initSdkContext({
        client: mockClient,
        $: mockShell,
        serverUrl: mockServerUrl,
        project: mockProject
      });

      assert.equal(isSdkAvailable(), true);

      resetSdkContext();

      assert.equal(getClient(), null);
      assert.equal(getShell(), null);
      assert.equal(getServerUrl(), null);
      assert.equal(getProject(), null);
      assert.equal(isSdkAvailable(), false);
    });
  });

  describe("withClient Execution", () => {
    test("executes callback with client when available", async () => {
      initSdkContext({
        client: mockClient,
        $: mockShell,
        serverUrl: mockServerUrl,
        project: mockProject
      });

      const result = await withClient(async (client) => {
        assert.equal(client, mockClient);
        return "success";
      });

      assert.equal(result, "success");
    });

    test("returns fallback when client is not available", async () => {
      const result = await withClient(async () => "success", "fallback");
      assert.equal(result, "fallback");
    });

    test("returns undefined when client is not available and no fallback provided", async () => {
      const result = await withClient(async () => "success");
      assert.equal(result, undefined);
    });

    test("returns fallback when callback throws", async () => {
      initSdkContext({
        client: mockClient,
        $: mockShell,
        serverUrl: mockServerUrl,
        project: mockProject
      });

      const result = await withClient(async () => {
        throw new Error("Oops");
      }, "fallback");

      assert.equal(result, "fallback");
    });

    test("returns undefined when callback throws and no fallback provided", async () => {
      initSdkContext({
        client: mockClient,
        $: mockShell,
        serverUrl: mockServerUrl,
        project: mockProject
      });

      const result = await withClient(async () => {
        throw new Error("Oops");
      });

      assert.equal(result, undefined);
    });

    test("passes through result from async operation", async () => {
       initSdkContext({
        client: mockClient,
        $: mockShell,
        serverUrl: mockServerUrl,
        project: mockProject
      });

      const result = await withClient(async (client) => {
        return Promise.resolve(42);
      });

      assert.equal(result, 42);
    });
  });
});
