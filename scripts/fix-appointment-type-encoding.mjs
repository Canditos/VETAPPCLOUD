import { Client } from "pg";

const hasFixFlag = process.argv.includes("--fix");
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("DATABASE_URL is required.");
  process.exit(1);
}

const client = new Client({ connectionString: databaseUrl });

const countSql = `
  SELECT count(*)::int AS corrupted
  FROM "Appointment"
  WHERE type LIKE '%' || chr(65533) || '%';
`;

const fixSql = `
  UPDATE "Appointment"
  SET type = replace(
              replace(
                replace(type,
                  'Observa' || chr(65533) || chr(65533) || 'o',
                  'Observação'
                ),
                'Domic' || chr(65533) || 'lio',
                'Domicílio'
              ),
              'Urg' || chr(65533) || 'ncia',
              'Urgência'
            )
  WHERE type LIKE '%' || chr(65533) || '%';
`;

try {
  await client.connect();

  const before = await client.query(countSql);
  const corruptedBefore = before.rows[0]?.corrupted ?? 0;

  if (!hasFixFlag) {
    if (corruptedBefore > 0) {
      console.error(`[appt-encoding] Corrupted values detected: ${corruptedBefore}`);
      process.exit(1);
    }
    console.log("[appt-encoding] OK");
    process.exit(0);
  }

  const updated = await client.query(fixSql);
  const after = await client.query(countSql);
  const corruptedAfter = after.rows[0]?.corrupted ?? 0;

  console.log(`[appt-encoding] Updated rows: ${updated.rowCount ?? 0}`);
  console.log(`[appt-encoding] Remaining corrupted values: ${corruptedAfter}`);

  if (corruptedAfter > 0) {
    process.exit(1);
  }
} catch (error) {
  console.error("[appt-encoding] Failed:", error);
  process.exit(1);
} finally {
  await client.end();
}
