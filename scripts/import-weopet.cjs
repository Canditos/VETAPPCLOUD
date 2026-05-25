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

const HTTP_TIMEOUT = 15000; // 15s per request
const CONCURRENCY = 5;      // 5 animals at a time
const LIMIT = parseInt(process.env.WEOPET_LIMIT || "0"); // 0 = all animals
const CHECKPOINT_FILE = path.join(__dirname, "weopet-checkpoint.json");

// ─── HTTP helpers with timeout ────────────────────────────────────

function httpGet(urlPath, cookie) {
  return new Promise((resolve, reject) => {
    const req = https.get({
      hostname: WEOPET_HOST, path: urlPath,
      headers: { "User-Agent": "Mozilla/5.0", ...(cookie ? { Cookie: cookie } : {}) },
    }, (res) => {
      let data = "";
      res.on("data", (c) => data += c);
      res.on("end", () => resolve({ data, headers: res.headers, status: res.statusCode }));
    });
    req.on("error", reject);
    req.setTimeout(HTTP_TIMEOUT, () => { req.destroy(); reject(new Error("Timeout: " + urlPath)); });
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
    req.setTimeout(HTTP_TIMEOUT, () => { req.destroy(); reject(new Error("Timeout: " + urlPath)); });
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
  console.log("Login OK");
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
    if (LIMIT > 0 && all.length >= LIMIT) break;
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

  const ownerMatch = html.match(/Cliente\s*<\/td>\s*<td[^>]*>\s*<a[^>]*>([^<]*)<\/a>/);
  const ownerName = ownerMatch ? ownerMatch[1].trim() : "";

  let totalCount = 0;
  const pagMatch = html.match(/(\d+)\s*consultas?\s*(registadas|encontradas)?/i)
    || html.match(/total[:\s]*(\d+)/i)
    || html.match(/(\d+)\s*registos/i)
    || html.match(/de\s+(\d+)\s*(resultados|registos|consultas)/i);
  if (pagMatch) totalCount = parseInt(pagMatch[1]);

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

  return { animalNumber, animalName, ownerName, appointments, totalCount };
}

async function fetchAnimalPage(hash, page = 1) {
  const res = await httpGet(`/admin.php?module=animal&func=view&id=${hash}&page=${page}`, cookieStr);
  return parseAnimalPage(res.data);
}

async function fetchAllAnimalAppointments(hash) {
  const firstPage = await fetchAnimalPage(hash, 1);
  const allApts = [...firstPage.appointments];
  const seenHashes = new Set(allApts.map(a => a.hash));

  // Paginate: stop when a page returns 0 new rows OR reappears (pagination loop)
  for (let p = 2; p <= 100; p++) {
    const page = await fetchAnimalPage(hash, p);
    if (page.appointments.length === 0) break;
    let newCount = 0;
    for (const apt of page.appointments) {
      if (!seenHashes.has(apt.hash)) {
        seenHashes.add(apt.hash);
        allApts.push(apt);
        newCount++;
      }
    }
    if (newCount === 0) break; // page had only duplicates
  }

  if (allApts.length > 50) {
    const sampleDates = allApts.slice(0, 5).map(a => a.dateStr).join(", ");
    console.log(`\n   [!] ${firstPage.animalName}: ${allApts.length} registos | dates: ${sampleDates} | tipos: ${[...new Set(allApts.map(a => a.type))].filter(Boolean).slice(0, 5).join(", ")}`);
  }

  return { ...firstPage, appointments: allApts };
}

// ─── Checkpoint helpers ──────────────────────────────────────────

function loadCheckpoint() {
  try {
    if (fs.existsSync(CHECKPOINT_FILE)) {
      const data = JSON.parse(fs.readFileSync(CHECKPOINT_FILE, "utf8"));
      console.log(`   Checkpoint found: ${data.done} / ${data.total} animals processed`);
      return data;
    }
  } catch {}
  return { done: 0, imported: 0, skipped: 0, errors: 0, total: 0, processed: [] };
}

function saveCheckpoint(state) {
  try { fs.writeFileSync(CHECKPOINT_FILE, JSON.stringify(state)); } catch {}
}

// ─── Main ────────────────────────────────────────────────────────

async function main() {
  console.log("=".repeat(60));
  console.log("weoPet → VetConnect Appointment Import");
  console.log("=".repeat(60));

  // 0. Resolve clinic and veterinarian
  console.log("\nLooking up clinic and veterinarian...");
  const clinic = await prisma.clinic.findFirst();
  if (!clinic) { console.error("No clinic found"); process.exit(1); }
  const CLINIC_ID = clinic.id;
  console.log(`   Clinic: ${clinic.name} (${CLINIC_ID})`);

  const vet = await prisma.user.findFirst({ where: { clinicId: CLINIC_ID } });
  if (!vet) { console.error("No veterinarian found"); process.exit(1); }
  const VET_ID = vet.id;
  console.log(`   Veterinarian: ${vet.name} (${VET_ID})`);

  // 1. Build patient map
  console.log("\nBuilding patient map by name + owner...");
  const patients = await prisma.patient.findMany({
    where: { clinicId: CLINIC_ID },
    include: { owner: { select: { name: true } } },
  });
  const patientMap = new Map();
  for (const p of patients) {
    const key = (p.name + "|" + (p.owner?.name || "")).toLowerCase().replace(/\s+/g, " ").trim();
    if (!patientMap.has(key)) patientMap.set(key, p.id);
  }
  console.log(`   ${patientMap.size} unique name|owner pairs (${patients.length} total patients)`);

  // 2. Login + animal list
  await login();
  const animals = await fetchAnimalList();

  if (animals.length === 0) {
    console.log("\nNo animals found.");
    return;
  }

  // 3. Owner fallback map
  const ownerPatients = new Map();
  for (const p of patients) {
    const okey = (p.owner?.name || "").toLowerCase().replace(/\s+/g, " ").trim();
    if (!ownerPatients.has(okey)) ownerPatients.set(okey, []);
    ownerPatients.get(okey).push(p);
  }
  console.log(`   ${ownerPatients.size} unique owner names for fallback`);

  // 4. Load checkpoint
  const cp = loadCheckpoint();
  const processed = new Set(cp.processed || []);
  let remaining = animals.filter(a => !processed.has(a.hash));
  if (LIMIT > 0 && remaining.length > LIMIT) {
    console.log(`   Limiting to ${LIMIT} animals for test`);
    remaining = remaining.slice(0, LIMIT);
  }
  console.log(`   ${remaining.length} animals remaining (${animals.length - remaining.length} already done)\n`);

  // 5. Process animals with concurrency
  let imported = cp.imported || 0;
  let skipped = cp.skipped || 0;
  let errors = cp.errors || 0;
  let total = cp.total || 0;
  let done = cp.done || 0;
  const errorDetails = [], skipSamples = [], aptCounts = [];
  const startTime = Date.now();

  async function processAnimal(animal) {
    let page;
    try {
      page = await fetchAllAnimalAppointments(animal.hash);
    } catch (e) {
      return { error: e.message, animal: animal.name };
    }
    const aptCount = page.appointments.length;

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
      return { skipped: aptCount || 1, animal: page.animalName, owner: page.ownerName };
    }

    let localImported = 0, localErrors = 0, localTotal = 0;
    for (const apt of page.appointments) {
      const st = new Date(apt.dateStr);
      if (isNaN(st.getTime())) {
        localErrors++;
        if (errorDetails.length < 10) errorDetails.push({ animal: page.animalName, dateStr: apt.dateStr });
        continue;
      }
      const et = new Date(st);
      et.setMinutes(et.getMinutes() + 30);

      try {
        const consultationId = `weopet-consultation-${apt.hash}`;
        await prisma.consultation.upsert({
          where: { id: consultationId },
          update: {
            notes: {
              upsert: {
                update: {
                  subjective: apt.reason || "Consulta importada do weoPet",
                  objective: [apt.veterinarian ? `Médico: ${apt.veterinarian}` : null, apt.weight ? `Peso: ${apt.weight}` : null, apt.temp ? `Temp: ${apt.temp}` : null].filter(Boolean).join("\n") || null,
                  assessment: apt.type || null,
                },
                create: {
                  subjective: apt.reason || "Consulta importada do weoPet",
                  objective: [apt.veterinarian ? `Médico: ${apt.veterinarian}` : null, apt.weight ? `Peso: ${apt.weight}` : null, apt.temp ? `Temp: ${apt.temp}` : null].filter(Boolean).join("\n") || null,
                  assessment: apt.type || null,
                },
              },
            },
          },
          create: {
            id: consultationId,
            clinicId: CLINIC_ID,
            patientId: pid,
            veterinarianId: VET_ID,
            date: st,
            status: "COMPLETED",
            notes: {
              create: {
                 subjective: apt.reason || "Consulta importada do weoPet",
                  objective: [apt.veterinarian ? `Médico: ${apt.veterinarian}` : null, apt.weight ? `Peso: ${apt.weight}` : null, apt.temp ? `Temp: ${apt.temp}` : null].filter(Boolean).join("\n") || null,
                  assessment: apt.type || null,
                },
              },
            },
          },
        });
        await prisma.appointment.upsert({
          where: { id: `weopet-${apt.hash}` },
          update: { type: apt.type || undefined, reason: apt.reason || undefined, consultationId },
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
            consultationId,
          },
        });
        localImported++;
      } catch (e) {
        localErrors++;
        if (errorDetails.length < 10) errorDetails.push({ animal: page.animalName, error: e.message });
      }
      localTotal++;
    }

    if (aptCounts.length < 50) aptCounts.push({ animal: page.animalName, count: localTotal });
    return { imported: localImported, skipped: 0, errors: localErrors, total: localTotal, animal: page.animalName };
  }

  // Process in batches
  for (let i = 0; i < remaining.length; i += CONCURRENCY) {
    const batch = remaining.slice(i, i + CONCURRENCY);
    const results = await Promise.all(batch.map(animal => processAnimal(animal)));

    for (const r of results) {
      done++;
      if (r.error) {
        console.log(`\n  [${done}/${animals.length}] ${r.animal.slice(0, 25).padEnd(26)} ERRO: ${r.error}`);
        errors++;
        if (errorDetails.length < 10) errorDetails.push({ animal: r.animal, error: r.error });
        // Don't mark as processed on error so it retries
        continue;
      }
      if (r.skipped) {
        skipped += r.skipped;
        if (skipSamples.length < 10) skipSamples.push({ animal: r.animal, owner: r.owner });
      } else {
        imported += r.imported || 0;
        errors += r.errors || 0;
        total += r.total || 0;
      }
      processed.add(batch[results.indexOf(r)].hash);
    }

    // Progress line
    const elapsed = Math.round((Date.now() - startTime) / 1000);
    const rate = done > 0 && elapsed > 0 ? (done / elapsed).toFixed(1) : "0.0";
    const eta = rate > 0 ? Math.round((animals.length - done) / parseFloat(rate)) : 0;
    const etaStr = eta > 0 ? `ETA ${Math.floor(eta / 60)}m${eta % 60}s` : "";
    process.stdout.write(`\r   [${done}/${animals.length}] ${imported} imported / ${skipped} skipped / ${errors} errors | ${elapsed}s @ ${rate}/s ${etaStr}`);

    // Save checkpoint every 10 animals
    if (done % 10 === 0) {
      saveCheckpoint({ done, imported, skipped, errors, total, processed: [...processed] });
    }
  }

  // Final checkpoint
  saveCheckpoint({ done, imported, skipped, errors, total, processed: [...processed] });

  const totalElapsed = Math.round((Date.now() - startTime) / 1000);
  console.log("\n\n" + "=".repeat(60));
  console.log("Done!");
  console.log(`   Animals:     ${animals.length}`);
  console.log(`   Found:       ${total} appointments`);
  console.log(`   Imported:    ${imported}`);
  console.log(`   Skipped:     ${skipped}`);
  console.log(`   Errors:      ${errors}`);
  console.log(`   Time:        ${Math.floor(totalElapsed / 60)}m ${totalElapsed % 60}s`);
  console.log(`   Target:      61480`);

  if (errorDetails.length > 0) {
    console.log("\n--- Errors (first " + errorDetails.length + ") ---");
    errorDetails.forEach(e => console.log("   " + JSON.stringify(e)));
  }

  if (skipSamples.length > 0) {
    console.log("\n--- Skipped (first " + skipSamples.length + ") ---");
    skipSamples.forEach(s => console.log('   "' + s.animal + '" | owner: "' + s.owner + '"'));
  }

  if (aptCounts.length > 0) {
    const counts = aptCounts.map(a => a.count).sort((a, b) => a - b);
    const sum = counts.reduce((a, b) => a + b, 0);
    const min = counts[0], max = counts[counts.length-1], median = counts[Math.floor(counts.length/2)];
    console.log(`\n--- Appointment distribution (sample: ${counts.length} animals) ---`);
    console.log(`   Min: ${min} | Max: ${max} | Median: ${median} | Avg: ${Math.round(sum/counts.length)}`);
    console.log(`   Sample details:`);
    aptCounts.filter(a => a.count > 100).slice(0, 5).forEach(a =>
      console.log(`     ${a.animal}: ${a.count} registos`)
    );
    aptCounts.filter(a => a.count <= 5).slice(0, 3).forEach(a =>
      console.log(`     ${a.animal}: ${a.count} registos`)
    );
  }

  try { fs.writeFileSync("weopet-import-log.json", JSON.stringify({ total, imported, skipped, errors, errorDetails, skipSamples, elapsed: totalElapsed })); } catch {}
}

main()
  .catch((e) => { console.error("\nFatal:", e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
