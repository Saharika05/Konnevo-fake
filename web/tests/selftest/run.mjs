// Runs the mock API and form-rule checks in plain Node, no browser needed.
//   pnpm test:mock
// It bundles each check with esbuild (msw is swapped for a tiny stand-in in msw-shim.ts),
// then runs the result and fails if any check fails.
import { build } from "esbuild";
import { execFileSync } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "../..");
const out = mkdtempSync(join(tmpdir(), "konnevo-selftest-"));
// Lets the checks run where packages live outside the project (set SELFTEST_NODE_PATHS=a:b).
const nodePaths = (process.env.SELFTEST_NODE_PATHS ?? "").split(":").filter(Boolean);

let failed = false;
for (const name of ["schemas", "mock-api", "core-api"]) {
  const outfile = join(out, `${name}.cjs`);
  await build({
    entryPoints: [join(here, `${name}.ts`)],
    bundle: true,
    platform: "node",
    format: "cjs",
    outfile,
    tsconfig: join(root, "tsconfig.json"),
    alias: { msw: join(here, "msw-shim.ts") },
    loader: { ".json": "json" },
    define: { "process.env.NEXT_PUBLIC_API_URL": '""' },
    nodePaths,
    logLevel: "error",
  });
  console.log(`\n=== ${name} ===`);
  try {
    const text = execFileSync("node", [outfile], { encoding: "utf8" });
    const bad = text
      .split("\n")
      .filter((line) => line.startsWith("FAIL") || line.includes("FAILED") || line.startsWith("CRASH"));
    console.log(
      text
        .split("\n")
        .filter((line) => !line.startsWith("ok"))
        .join("\n"),
    );
    if (bad.length > 0) failed = true;
  } catch (error) {
    console.log(error.stdout?.toString() ?? "", error.stderr?.toString() ?? "");
    failed = true;
  }
}
process.exit(failed ? 1 : 0);
