/**
 * weoPet → VetConnect Appointment Importer
 * Zero external HTTP dependencies — uses only Node.js built-ins + Prisma
 *
 * Usage:
 *   DATABASE_URL="postgres://..." \
 *   WEOPET_EMAIL="marco.candido@gmail.com" \
 *   WEOPET_PASSWORD="canditos" \
 *   node scripts/import-weopet.cjs
 */

const path = require("path");
const fs = require("fs");

for (const base of [__dirname, path.join(__dirname, ".."), "/app"]) {
  for (const sub of [".next/standalone/node_modules", "node_modules"]) {
    const dir = path.join(base, sub);
    if (fs.existsSync(dir)) { module.paths.push(dir); break; }
  }
  if (module.paths.length > 1) break;
}

const https = require("https");
const querystring = require("querystring");
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const WEOPET_HOST = "weopet.com";

const EMAIL = process.env.WEOPET_EMAIL;
const PASSWORD = process.env.WEOPET_PASSWORD;

if (!EMAIL || !PASSWORD) {
  console.error("WEOPET_EMAIL and WEOPET_PASSWORD are required");
  process.exit(1);
}

// ─── HTTP helpers ────────────────────────────────────────────────

function httpGet(urlPath, cookie) {
  return new Promise((resolve, reject) => {
    https.get({
      hostname: WEOPET_HOST, path: urlPath,
      headers: { "User-Agent": "Mozilla/5.0", ...(cookie ? { Cookie: cookie } : {}) },
    }, (res) => {
      let data = "";
      res.on("data", (c) => data += c);
      res.on("end", () => resolve({ data, headers: res.headers, status: res.statusCode }));
    }).on("error", reject);
  });
}

function httpPost(urlPath, body, cookie) {
  return new Promise((resolve, reject) => {
    const postData = querystring.stringify(body);
    const req = https.request({
      hostname: WEOPET_HOST, path: urlPath, method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Content-Length": Buffer.byteLength(postData),
        "User-Agent": "Mozilla/5.0",
        ...(cookie ? { Cookie: cookie } : {}),
      },
    }, (res) => {
      let data = "";
      res.on("data", (c) => data += c);
      res.on("end", () => resolve({ data, headers: res.headers, status: res.statusCode }));
    });
    req.on("error", reject);
    req.write(postData);
    req.end();
  });
}

// ─── Auth ────────────────────────────────────────────────────────

let cookieStr = "";

async function login() {
  console.log("Logging in to weoPet...");
  const res = await httpPost("/admin.php?type=adminform&module=user&func=submitlogin", { email: EMAIL, password: PASSWORD });
  const setCookie = res.headers["set-cookie"];
  if (setCookie) {
    const jar = {};
    for (const c of (Array.isArray(setCookie) ? setCookie : [setCookie])) {
      const [kv] = c.split(";");
      const [k, v] = kv.split("=");
      jar[k] = v;
    }
    cookieStr = Object.entries(jar).map(([k, v]) => `${k}=${v}`).join("; ");
  }

  if (res.status !== 302) throw new Error("Login failed — status " + res.status);
  console.log("Login OK (redirect to " + res.headers.location + ")");
}

// ─── Animal list ─────────────────────────────────────────────────

function extractAnimalLinks(html) {
  const animals = [];
  const regex = /<a\s[^>]*href="([^"]*module=animal[&]func=view[^"]*)">([^<]*)<\/a>/gi;
  let m;
  while ((m = regex.exec(html)) !== null) {
    const hash = m[1].match(/id=([a-f0-9]+)/);
    const name = m[2].trim();
    if (hash && name && !animals.find(a => a.hash === hash[1])) {
      animals.push({ hash: hash[1], name });
    }
  }
  return animals;
}

async function fetchAnimalList() {
  console.log("Fetching animal list...");
  const all = [];
  let page = 1;
  while (true) {
    const res = await httpGet(`/admin.php?module=animal&func=list&page=${page}`, cookieStr);
    const batch = extractAnimalLinks(res.data);
    if (batch.length === 0) break;
    for (const a of batch) if (!all.find(x => x.hash === a.hash)) all.push(a);
    console.log(`   ${all.length} animals (page ${page})...`);
    if (batch.length < 20) break;
    page++;
  }
  console.log(`Total: ${all.length} animals`);
  return all;
}

// ─── Animal detail → appointments ───────────────────────────────

function cleanText(str) {
  return str.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function parseAnimalPage(html) {
  const idMatch = html.match(/var\s+animalid\s*=\s*['"](\d+)['"]/);
  const animalNumber = idMatch ? idMatch[1] : null;

  const titleMatch = html.match(/<div class="title"><a>Animal<\/a>\s*<span>([^<]*)<\/span>/);
  const animalName = titleMatch ? titleMatch[1].trim() : "Unknown";

  // Extract owner name: <td class="col_field">Cliente </td> ... >Owner Name</a>
  const ownerMatch = html.match(/Cliente\s*<\/td>\s*<td[^>]*>\s*<a[^>]*>([^<]*)<\/a>/);
  const ownerName = ownerMatch ? ownerMatch[1].trim() : "";

  const appointments = [];
  const rowRegex = /<tr class="row">(.*?)<\/tr>/gs;
  let rowM;
  while ((rowM = rowRegex.exec(html)) !== null) {
    const cells = [];
    const cellRegex = /<td[^>]*>(.*?)<\/td>/gs;
    let c;
    while ((c = cellRegex.exec(rowM[1])) !== null) cells.push(c[1]);
    if (cells.length < 6) continue;

    const linkM = cells[0].match(/href="[^"]*id=([a-f0-9]+)/);
    if (!linkM) continue;

    appointments.push({
      hash: linkM[1],
      dateStr: cleanText(cells[0]),
      veterinarian: cleanText(cells[1]),
      type: cleanText(cells[2]),
      reason: cleanText(cells[3]),
      temp: cleanText(cells[4]),
      weight: cleanText(cells[5]),
    });
  }

  return { animalNumber, animalName, ownerName, appointments };
}

async function fetchAnimalPage(hash) {
  const res = await httpGet(`/admin.php?module=animal&func=view&id=${hash}`, cookieStr);
  return parseAnimalPage(res.data);
}

// ─── Main ────────────────────────────────────────────────────────

async function main() {
  console.log("=".repeat(60));
  console.log("weoPet → VetConnect Appointment Import");
  console.log("=".repeat(60));

  // 0. Resolve clinic and veterinarian from DB
  console.log("\nLooking up clinic and veterinarian...");
  const clinic = await prisma.clinic.findFirst();
  if (!clinic) { console.error("No clinic found in database"); process.exit(1); }
  const CLINIC_ID = clinic.id;
  console.log(`   Clinic: ${clinic.name} (${CLINIC_ID})`);

  const vet = await prisma.user.findFirst({ where: { clinicId: CLINIC_ID } });
  if (!vet) { console.error("No veterinarian found in database"); process.exit(1); }
  const VET_ID = vet.id;
  console.log(`   Veterinarian: ${vet.name} (${VET_ID})`);

  // 1. Build patient map by (animalName, ownerName) pair
  console.log("\nBuilding patient map by name + owner...");
  const patients = await prisma.patient.findMany({
    where: { clinicId: CLINIC_ID },
    include: { owner: { select: { name: true } } },
  });
  const patientMap = new Map();
  let matched = 0;
  for (const p of patients) {
    const key = (p.name + "|" + (p.owner?.name || "")).toLowerCase().replace(/\s+/g, " ").trim();
    if (!patientMap.has(key)) patientMap.set(key, p.id);
    else matched--; // duplicate keys, track separately
    matched++;
  }
  console.log(`   ${patientMap.size} unique name|owner pairs (${patients.length} total patients)`);

  // 2. Login + animal list
  await login();
  const animals = await fetchAnimalList();

  if (animals.length === 0) {
    console.log("\nNo animals found. The HTML structure may have changed.");
    console.log("Open https://weopet.com/admin.php?module=animal&func=list manually to verify.");
    return;
  }

  // 3. Build owner→patients map for fallback matching
  const ownerPatients = new Map();
  for (const p of patients) {
    const okey = (p.owner?.name || "").toLowerCase().replace(/\s+/g, " ").trim();
    if (!ownerPatients.has(okey)) ownerPatients.set(okey, []);
    ownerPatients.get(okey).push(p);
  }
  console.log(`   ${ownerPatients.size} unique owner names for fallback`);

  // 4. Import appointments
  let imported = 0, skipped = 0, errors = 0, total = 0;
  const errorDetails = [], skipSamples = [];

  for (const [i, animal] of animals.entries()) {
    process.stdout.write(`\r   [${i + 1}/${animals.length}] ${animal.name.slice(0, 35).padEnd(36)}`);

    const page = await fetchAnimalPage(animal.hash);

    // Strategy 1: exact name|owner match
    const key = (page.animalName + "|" + page.ownerName).toLowerCase().replace(/\s+/g, " ").trim();
    let pid = patientMap.get(key);

    // Strategy 2: owner match → filter by name
    if (!pid && page.ownerName) {
      const okey = page.ownerName.toLowerCase().replace(/\s+/g, " ").trim();
      const ownerPets = ownerPatients.get(okey);
      if (ownerPets) {
        const pname = page.animalName.toLowerCase().replace(/\s+/g, " ").trim();
        const match = ownerPets.find(p => p.name.toLowerCase().replace(/\s+/g, " ").trim() === pname);
        if (match) pid = match.id;
      }
    }

    if (!pid) {
      skipped += page.appointments.length || 1;
      if (skipSamples.length < 10) skipSamples.push({ animal: page.animalName, owner: page.ownerName });
      continue;
    }

    for (const apt of page.appointments) {
      const st = new Date(apt.dateStr);
      if (isNaN(st.getTime())) {
        errors++;
        if (errorDetails.length < 10) errorDetails.push({ animal: page.animalName, dateStr: apt.dateStr });
        continue;
      }
      const et = new Date(st);
      et.setMinutes(et.getMinutes() + 30);

      try {
        await prisma.appointment.upsert({
          where: { id: `weopet-${apt.hash}` },
          update: { type: apt.type || undefined, reason: apt.reason || undefined },
          create: {
            id: `weopet-${apt.hash}`,
            clinicId: CLINIC_ID,
            patientId: pid,
            veterinarianId: VET_ID,
            startTime: st,
            endTime: et,
            type: apt.type || null,
            reason: apt.reason || null,
            status: "COMPLETED",
          },
        });
        imported++;
      } catch (e) {
        errors++;
        if (errorDetails.length < 10) errorDetails.push({ animal: page.animalName, error: e.message });
      }
    }
    total += page.appointments.length;
  }

  console.log("\n\n" + "=".repeat(60));
  console.log("Done!");
  console.log(`   Animals:  ${animals.length}`);
  console.log(`   Found:    ${total} appointments`);
  console.log(`   Imported: ${imported}`);
  console.log(`   Skipped:  ${skipped}`);
  console.log(`   Errors:   ${errors}`);

  if (errorDetails.length > 0) {
    console.log("\n--- Error details (first " + errorDetails.length + ") ---");
    errorDetails.forEach(e => console.log("   " + JSON.stringify(e)));
  }

  if (skipSamples.length > 0) {
    console.log("\n--- Skipped samples (first " + skipSamples.length + ") ---");
    skipSamples.forEach(s => console.log('   "' + s.animal + '" | owner: "' + s.owner + '"'));
  }

  try { fs.writeFileSync("weopet-import-log.json", JSON.stringify({ total, imported, skipped, errors, errorDetails, skipSamples })); } catch {}
}

main()
  .catch((e) => { console.error("\nFatal:", e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
