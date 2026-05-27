import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const apiRoot = path.join(root, "src", "app", "api");

const allowedNoneRoutes = new Set([
  "src/app/api/auth/register/route.ts",
  "src/app/api/auth/[...nextauth]/route.ts",
  "src/app/api/cron/reminder-24h/route.ts",
  "src/app/api/cron/vaccine-alert/route.ts",
  "src/app/api/debug/seed/route.ts",
  "src/app/api/dev/run-tests/route.ts",
  "src/app/api/health/route.ts",
  "src/app/api/integrations/examion/route.ts",
  "src/app/api/integrations/fuji/route.ts",
  "src/app/api/portal/auth/login/route.ts",
  "src/app/api/portal/auth/logout/route.ts",
  "src/app/api/portal/auth/magic/route.ts",
  "src/app/api/privacy/policy/route.ts",
]);

function collectRouteFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectRouteFiles(fullPath));
      continue;
    }

    if (entry.isFile() && entry.name === "route.ts") {
      files.push(fullPath);
    }
  }

  return files;
}

function classify(filePath) {
  const content = fs.readFileSync(filePath, "utf8");

  if (/withRole|withRoleParams/.test(content)) return "withRole";
  if (/withAuth|withAuthParams/.test(content)) return "withAuth";
  if (/withPortalSession|withPortalSessionParams/.test(content)) return "withPortalSession";
  return "none";
}

const routeFiles = collectRouteFiles(apiRoot);
const counts = {
  withRole: 0,
  withAuth: 0,
  withPortalSession: 0,
  none: 0,
};

const unexpectedNoneRoutes = [];

for (const routeFile of routeFiles) {
  const relPath = path.relative(root, routeFile).replace(/\\/g, "/");
  const kind = classify(routeFile);
  counts[kind] += 1;

  if (kind === "none" && !allowedNoneRoutes.has(relPath)) {
    unexpectedNoneRoutes.push(relPath);
  }
}

console.log(`[guard-check] total=${routeFiles.length} withRole=${counts.withRole} withAuth=${counts.withAuth} withPortalSession=${counts.withPortalSession} none=${counts.none}`);

if (unexpectedNoneRoutes.length > 0) {
  console.error("[guard-check] Unexpected routes without explicit guard wrapper:");
  for (const route of unexpectedNoneRoutes) {
    console.error(` - ${route}`);
  }
  process.exit(1);
}

console.log("[guard-check] OK");
