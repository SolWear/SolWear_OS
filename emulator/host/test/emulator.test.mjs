import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { MockDaemon, ERR_CAPABILITY_DENIED, ERR_INVALID_PARAMS, ERR_INVALID_REQUEST } from "../src/daemon.mjs";
import { EmulatorServer } from "../src/server.mjs";

const profile = { id: "test-round", screen: { width: 240, height: 240, shape: "round" }, mock: { batteryPercent: 73 } };
const app = { id: "tech.solwear.test", name: "Test", version: "1.0.0", type: "app", entry: "index.html", capabilities: ["system", "power"] };

test("mock daemon enforces app capabilities and exposes shell parity methods", async () => {
  const daemon = new MockDaemon({ profile, apps: [app] });
  const power = await daemon.handle({ jsonrpc: "2.0", id: 1, method: "power.status" }, app.id);
  assert.equal(power.result.percent, 73);
  const denied = await daemon.handle({ jsonrpc: "2.0", id: 2, method: "wallet.publicKey" }, app.id);
  assert.equal(denied.error.code, ERR_CAPABILITY_DENIED);
  const network = await daemon.handle({ jsonrpc: "2.0", id: 3, method: "system.network" }, "system");
  assert.equal(network.result.connected, true);
  const sensors = await daemon.handle({ jsonrpc: "2.0", id: 4, method: "shell.sensors" }, "system");
  assert.ok(sensors.result.sensors.includes("heartRate"));
});

test("wallet signs only after an affirmative confirmation", async () => {
  const walletApp = { ...app, capabilities: ["wallet"] };
  const daemon = new MockDaemon({ profile, apps: [walletApp] });
  daemon.confirm = async () => false;
  const rejected = await daemon.handle({ jsonrpc: "2.0", id: 1, method: "wallet.signTransaction", params: { appId: app.id, message: Buffer.from("hello").toString("base64") } }, app.id);
  assert.equal(rejected.error.code, -32002);
  daemon.confirm = async (request) => request.summary.byteLength === 5;
  const signed = await daemon.handle({ jsonrpc: "2.0", id: 2, method: "wallet.signTransaction", params: { appId: app.id, message: Buffer.from("hello").toString("base64") } }, app.id);
  assert.match(signed.result.signature, /^[1-9A-HJ-NP-Za-km-z]+$/);
});

test("NFC mock exposes the legacy wallet NDEF contract", async () => {
  const nfcApp = { ...app, capabilities: ["nfc"] };
  const daemon = new MockDaemon({ profile, apps: [nfcApp] });
  const armed = await daemon.handle({ jsonrpc: "2.0", id: 1, method: "nfc.setEnabled", params: { enabled: true } }, app.id);
  assert.deepEqual(armed.result, {});
  const record = await daemon.handle({ jsonrpc: "2.0", id: 2, method: "nfc.walletRecord" }, app.id);
  assert.equal(record.result.externalType, "solwear:wallet");
  assert.equal(record.result.payload.version, 1);
  assert.equal(record.result.payload.network, "devnet");
  assert.match(record.result.payload.pubkey, /^[1-9A-HJ-NP-Za-km-z]+$/);
});

test("mock daemon matches real-daemon validation and transaction encodings", async () => {
  const rpcApp = { ...app, capabilities: ["display", "notifications", "wallet"] };
  const daemon = new MockDaemon({ profile, apps: [rpcApp] });
  const summaries = [];
  daemon.confirm = async ({ summary }) => { summaries.push(summary); return true; };

  const notification = await daemon.handle({ jsonrpc: "2.0", id: 1, method: "notifications.post", params: { title: "Title" } }, app.id);
  assert.equal(notification.result.id.length > 0, true);
  assert.equal(daemon.notifications[0].body, "");

  for (const [encoding, message] of [["base64", "aGk="], ["base58", "8wr"], ["hex", "6869"]]) {
    const reply = await daemon.handle({ jsonrpc: "2.0", id: encoding, method: "wallet.signTransaction", params: { appId: app.id, message, encoding } }, app.id);
    assert.match(reply.result.signature, /^[1-9A-HJ-NP-Za-km-z]+$/);
  }
  assert.deepEqual(summaries.map((summary) => summary.byteLength), [2, 2, 2]);

  const invalidBase64 = await daemon.handle({ jsonrpc: "2.0", id: 2, method: "wallet.signTransaction", params: { appId: app.id, message: "***" } }, app.id);
  assert.equal(invalidBase64.error.code, ERR_INVALID_PARAMS);
  const empty = await daemon.handle({ jsonrpc: "2.0", id: 3, method: "wallet.signTransaction", params: { appId: app.id, message: "" } }, app.id);
  assert.equal(empty.error.code, ERR_INVALID_PARAMS);
  const wrongApp = await daemon.handle({ jsonrpc: "2.0", id: 4, method: "wallet.signTransaction", params: { appId: "dev.solwear.other", message: "aGk=" } }, app.id);
  assert.equal(wrongApp.error.code, ERR_INVALID_PARAMS);
  const brightness = await daemon.handle({ jsonrpc: "2.0", id: 5, method: "display.setBrightness", params: { percent: 101 } }, app.id);
  assert.equal(brightness.error.code, ERR_INVALID_PARAMS);
  const positional = await daemon.handle({ jsonrpc: "2.0", id: 6, method: "display.getBrightness", params: [] }, app.id);
  assert.equal(positional.error.code, ERR_INVALID_REQUEST);
  const unknown = await daemon.handle({ jsonrpc: "2.0", id: 7, method: "not-a-method" }, app.id);
  assert.equal(unknown.error.code, -32601);
  const unknownSystem = await daemon.handle({ jsonrpc: "2.0", id: 8, method: "future.unknown" }, "system");
  assert.equal(unknownSystem.error.code, -32601);
});

test("mock HAL controls reject invalid values instead of leaking null into JSON", () => {
  const daemon = new MockDaemon({ profile, apps: [app] });
  assert.throws(() => daemon.hal.control("battery", "not-a-number"), /battery must be a number/);
  assert.throws(() => daemon.hal.control("heartRate", 500), /heart rate must be a number/);
  assert.throws(() => daemon.hal.control("charging", "maybe"), /charging must be/);
});

test("host server serves the shell/app and speaks JSON-RPC over WebSocket", async (context) => {
  const root = mkdtempSync(join(tmpdir(), "solwear-emulator-"));
  const webDir = join(root, "web"); const shellDir = join(root, "shell"); const appDir = join(root, "app");
  for (const dir of [webDir, shellDir, appDir]) mkdirSync(dir);
  writeFileSync(join(webDir, "index.html"), "emulator"); writeFileSync(join(shellDir, "index.html"), "shell"); writeFileSync(join(appDir, "index.html"), "app");
  const server = new EmulatorServer({ profile, profiles: [profile], allProfiles: [profile], webDir, shellDir, appDir, appManifest: app, systemApps: [], appRoots: { [app.id]: appDir }, httpPort: 0, rpcPort: 0 });
  await server.listen(); context.after(() => server.close());
  assert.equal(await fetch(server.url).then((response) => response.text()), "emulator");
  assert.equal(await fetch(`${server.url}apps/${app.id}/index.html`).then((response) => response.text()), "app");
  const devtools = await fetch(`${server.url}emulator/devtools.json`).then((response) => response.json());
  assert.equal(devtools.profile, profile.id);
  assert.equal(devtools.hal.power.percent, 73);
  const invalidControl = await fetch(`${server.url}emulator/control?name=battery&value=nope`);
  assert.equal(invalidControl.status, 400);
  assert.match(await invalidControl.text(), /battery must be a number/);

  const socket = new WebSocket(`ws://127.0.0.1:${server.options.rpcPort}/rpc?appId=${app.id}`);
  await new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve, { once: true });
    socket.addEventListener("error", (event) => reject(new Error(event.message || String(event.error || "WebSocket failed"))), { once: true });
  });
  const reply = new Promise((resolve) => socket.addEventListener("message", (event) => resolve(JSON.parse(event.data)), { once: true }));
  socket.send(JSON.stringify({ jsonrpc: "2.0", id: 9, method: "system.info", params: {} }));
  assert.equal((await reply).result.screen.width, 240);
  const closed = new Promise((resolve) => socket.addEventListener("close", resolve, { once: true }));
  socket.addEventListener("error", () => undefined);
  socket.close();
  await closed;
});

test("daemon events are sent only to the privileged shell connection", () => {
  const root = mkdtempSync(join(tmpdir(), "solwear-emulator-"));
  const server = new EmulatorServer({ profile, webDir: root, shellDir: root, appDir: root, appManifest: app, systemApps: [], httpPort: 0, rpcPort: 0 });
  const shellMessages = [];
  const appMessages = [];
  server.sockets.add({ url: new URL("ws://127.0.0.1/rpc"), sendJson: (value) => shellMessages.push(value) });
  server.sockets.add({ url: new URL(`ws://127.0.0.1/rpc?appId=${app.id}`), sendJson: (value) => appMessages.push(value) });
  server.broadcast("apps.changed", { reason: "installed" });
  assert.equal(shellMessages.length, 1);
  assert.equal(appMessages.length, 0);
  server.sockets.clear();
  server.close();
});
