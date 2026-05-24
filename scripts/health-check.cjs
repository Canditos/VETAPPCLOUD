/**
 * Health check — corre antes do deploy para detetar erros
 * Uso: DATABASE_URL="..." node scripts/health-check.cjs
 */
const path = require("path");
const fs = require("fs");
const http = require("http");

for (const base of [__dirname, path.join(__dirname, "..")]) {
  const dir = path.join(base, ".next", "standalone", "node_modules");
  if (fs.existsSync(dir)) { module.paths.push(dir); break; }
}

const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");

const API = "http://localhost:3000";
const PASS = [], FAIL = [];

function ok(label) { PASS.push(label); process.stdout.write("."); }
function fail(label, err) { FAIL.push({ label, err }); process.stdout.write("F"); }

function httpGet(urlPath, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const req = http.get(`${API}${urlPath}`, { timeout }, (res) => {
      res.resume();
      resolve(res.statusCode);
    });
    req.on("error", (e) => reject(e));
    req.on("timeout", () => { req.destroy(); reject(new Error("timeout")); });
  });
}

async function checkApi(path, timeout) {
  try {
    const status = await httpGet(path, timeout);
    if (status >= 500) fail(path, `HTTP ${status}`);
    else ok(path);
  } catch (e) {
    if (e.code === "ECONNREFUSED") fail(path, "Server not running on :3000");
    else if (e.message === "timeout") fail(path, "Timeout (>10s)");
    else fail(path, e.message);
  }
}

async function main() {
  console.log("\n# Health Check\n");
  process.stdout.write("Testing APIs: ");

  const endpoints = [
    "/api/dashboard/stats",
    "/api/appointments",
    "/api/patients",
    "/api/customers",
    "/api/prescriptions",
    "/api/inventory",
    "/api/consultations",
    "/api/billing",
    "/api/products",
    "/api/team",
    "/api/settings/automations",
    "/api/settings/rut240",
    "/api/notifications",
    "/api/marketing/campaigns",
    "/api/owners",
    "/api/sms-logs",
    "/api/hospitalization",
    "/api/clinic",
    "/api/integrations/siac/check",
    "/api/management/analytics",
    "/api/management/bi",
    "/api/management/health-plans",
  ];

  for (const ep of endpoints) await checkApi(ep);

  // DB connection
  try {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 5000 });
    const client = await pool.connect();
    await client.query("SELECT 1");
    client.release();
    ok("database");
  } catch (e) {
    fail("database", e.message);
  }

  // Patient history (the bug!)
  try {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const adapter = new PrismaPg(pool);
    const prisma = new PrismaClient({ adapter });
    const sample = await prisma.patient.findFirst({ select: { id: true } });
    if (sample) await checkApi(`/api/patients/${sample.id}/history`);
    else ok("patient-history (no patients)");
    await prisma.$disconnect();
  } catch (e) {
    fail("patient-history", e.message);
  }

  console.log("\n");
  console.log("=".repeat(50));
  console.log("Passed: " + PASS.length);
  console.log("Failed: " + FAIL.length);

  if (FAIL.length > 0) {
    console.log("\nFailures:");
    FAIL.forEach(f => console.log("  " + f.label + ": " + f.err));
    process.exit(1);
  }
}

main().catch(e => { console.error("\nFatal:", e.message); process.exit(1); });
