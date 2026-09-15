/** First-run bootstrap for `npm start` in a clean checkout. */

import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

function run(command, argv, cwd) {
  const result = spawnSync(command, argv, { cwd, stdio: "inherit" });
  if (result.error) throw new Error(`could not start ${command}: ${result.error.message}`);
  if (result.status !== 0) throw new Error(`${command} ${argv.join(" ")} exited with code ${result.status}`);
}

function ensureDependencies(npm, directory, marker) {
  if (existsSync(join(directory, marker))) return;
  process.stdout.write(`  first run: installing ${directory.split(/[\\/]/).slice(-2).join("/")} dependencies\n`);
  run(npm, ["ci", "--no-audit", "--no-fund"], directory);
}

/** Build the bundled watchface when the emulator is started from a clean clone. */
export function ensureDefaultApp(monorepo, appDir, { noBuild = false } = {}) {
  const manifest = join(appDir, "manifest.json");
  if (existsSync(manifest)) return false;
  if (noBuild) return false;

  const major = Number(process.versions.node.split(".")[0]);
  if (major < 22) throw new Error(`Node 22 or newer is required; this is Node ${process.versions.node}`);

  const npm = process.platform === "win32" ? "npm.cmd" : "npm";
  const runtime = join(monorepo, "sdk", "runtime");
  const cli = join(monorepo, "sdk", "cli");
  const watchface = join(monorepo, "apps", "watchface");
  for (const directory of [runtime, cli, watchface]) {
    if (!existsSync(join(directory, "package.json"))) {
      throw new Error(`cannot bootstrap the demo because ${join(directory, "package.json")} is missing`);
    }
  }

  process.stdout.write("\n  No built demo found; preparing the bundled watchface for this first run.\n");
  ensureDependencies(npm, runtime, join("node_modules", "typescript", "bin", "tsc"));
  run(npm, ["run", "build"], runtime);
  ensureDependencies(npm, cli, join("node_modules", "typescript", "bin", "tsc"));
  run(npm, ["run", "build"], cli);
  run(process.execPath, [join(cli, "dist", "bin.js"), "build"], watchface);
  return true;
}
