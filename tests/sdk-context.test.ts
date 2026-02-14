/**
 * SDK Context Tests
 * Verifies singleton behavior, initialization, and safe access patterns.
 */

import {
  initSdkContext,
  getClient,
  getShell,
  getServerUrl,
  getProject,
  resetSdkContext,
  isSdkAvailable,
  withClient,
} from "../src/hooks/sdk-context.js";

let passed = 0;
let failed_ = 0;

function assert(cond: boolean, name: string) {
  if (cond) {
    passed++;
    process.stderr.write(`  PASS: ${name}\n`);
  } else {
    failed_++;
    process.stderr.write(`  FAIL: ${name}\n`);
  }
}

async function testInitialization() {
  process.stderr.write("\n--- sdk-context: initialization ---\n");

  resetSdkContext();
  assert(!isSdkAvailable(), "start clean: sdk not available");
  assert(getClient() === null, "start clean: client is null");

  const mockClient = { id: "client1" } as any;
  const mockShell = { id: "shell1" } as any;
  const mockUrl = new URL("http://localhost:3000");
  const mockProject = { id: "proj1" } as any;

  initSdkContext({
    client: mockClient,
    $: mockShell,
    serverUrl: mockUrl,
    project: mockProject,
  });

  assert(isSdkAvailable(), "initialized: sdk available");
  assert(getClient() === mockClient, "initialized: client match");
  assert(getShell() === mockShell, "initialized: shell match");
  assert(getServerUrl() === mockUrl, "initialized: url match");
  assert(getProject() === mockProject, "initialized: project match");
}

async function testReset() {
  process.stderr.write("\n--- sdk-context: reset ---\n");

  // Assumes initialized from previous test
  resetSdkContext();

  assert(!isSdkAvailable(), "after reset: sdk not available");
  assert(getClient() === null, "after reset: client is null");
  assert(getShell() === null, "after reset: shell is null");
}

async function testWithClient() {
  process.stderr.write("\n--- sdk-context: withClient ---\n");

  resetSdkContext();

  // Case 1: Client not available
  const result1 = await withClient(async (c) => "success", "fallback");
  assert(result1 === "fallback", "withClient returns fallback when no client");

  const result2 = await withClient(async (c) => "success");
  assert(result2 === undefined, "withClient returns undefined when no client and no fallback");

  // Case 2: Client available
  const mockClient = { id: "client2" } as any;
  initSdkContext({ client: mockClient, $: {} as any, serverUrl: new URL("http://x"), project: {} as any });

  const result3 = await withClient(async (c) => {
    assert(c === mockClient, "withClient receives correct client");
    return "success";
  });
  assert(result3 === "success", "withClient executes fn when client available");

  // Case 3: Error in fn
  const result4 = await withClient(async (c) => {
    throw new Error("oops");
  }, "fallback-on-error");

  assert(result4 === "fallback-on-error", "withClient returns fallback on error");
}

async function main() {
  process.stderr.write("=== SDK Context Tests ===\n");

  await testInitialization();
  await testReset();
  await testWithClient();

  process.stderr.write(`\n=== SDK Context: ${passed} passed, ${failed_} failed ===\n`);
  if (failed_ > 0) process.exit(1);
}

main();
