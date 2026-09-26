// Checks that package.json "exports" (and the client/ stub) send each runtime
// to the right entry, for both the JS and the types. Runs against dist/.
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, symlinkSync, readFileSync, existsSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const pkgDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const tsc = join(pkgDir, "node_modules", "typescript", "bin", "tsc");
const fixture = (name) => join(pkgDir, "test", "fixtures", name);

// Imports `moosyl-sdk` (self-reference) under the given conditions and reports
// whether the webhook helpers are there, i.e. whether the full entry loaded.
function hasWebhookHelpers(conditions) {
  const out = execFileSync(
    process.execPath,
    [
      ...conditions.map((c) => `--conditions=${c}`),
      "--input-type=module",
      "-e",
      `const m = await import("moosyl-sdk");
       console.log(JSON.stringify({
         helper: typeof new m.Moosyl("k").constructWebhookEvent,
         error: typeof m.WebhookSignatureError,
         status: typeof new m.Moosyl("k").getPaymentStatus,
       }));`,
    ],
    { cwd: pkgDir, encoding: "utf8" },
  );
  const r = JSON.parse(out);
  assert.equal(r.status, "function");
  assert.equal(r.helper === "function", r.error === "function");
  return r.helper === "function";
}

function typecheck(file, extraArgs) {
  try {
    execFileSync(
      process.execPath,
      [tsc, "--noEmit", "--strict", "--skipLibCheck", "false", "--target", "es2022", "--lib", "es2022,dom", "--types", "node", ...extraArgs, file],
      { cwd: pkgDir, encoding: "utf8" },
    );
  } catch (e) {
    assert.fail(`tsc failed for ${file}:\n${e.stdout}${e.stderr}`);
  }
}

test("runtime: react-native and browser get the client entry; node and edge runtimes get the full entry", () => {
  assert.equal(hasWebhookHelpers([]), true, "default (node)");
  assert.equal(hasWebhookHelpers(["react-native"]), false, "react-native");
  assert.equal(hasWebhookHelpers(["browser"]), false, "browser");
  assert.equal(hasWebhookHelpers(["workerd", "worker", "browser"]), true, "Cloudflare Workers");
  assert.equal(hasWebhookHelpers(["edge-light", "browser"]), true, "Vercel Edge");
});

test("types: customConditions react-native / browser resolve to the client entry's declarations", () => {
  const bundler = ["--module", "esnext", "--moduleResolution", "bundler"];
  typecheck(fixture("client-entry-types.ts"), [...bundler, "--customConditions", "react-native"]);
  typecheck(fixture("client-entry-types.ts"), [...bundler, "--customConditions", "browser"]);
  typecheck(fixture("full-entry-types.ts"), [...bundler]);
});

test("legacy resolution (no package exports): moosyl-sdk/client resolves through client/package.json", () => {
  const stub = JSON.parse(readFileSync(join(pkgDir, "client", "package.json"), "utf8"));
  for (const key of ["main", "types", "react-native"]) {
    assert.ok(existsSync(join(pkgDir, "client", stub[key])), `client/package.json ${key} -> ${stub[key]} exists`);
  }
  // Put the package in a node_modules folder so node10 resolution (which ignores
  // "exports", like Metro without package-exports) can find it by name.
  const tmp = mkdtempSync(join(tmpdir(), "moosyl-sdk-exports-"));
  try {
    mkdirSync(join(tmp, "node_modules"));
    symlinkSync(pkgDir, join(tmp, "node_modules", "moosyl-sdk"), "dir");
    typecheck(fixture("legacy-subpath-types.ts"), [
      "--module", "commonjs", "--moduleResolution", "node10",
      "--baseUrl", join(tmp, "node_modules"),
      "--ignoreDeprecations", "5.0",
    ]);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});
