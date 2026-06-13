export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import { withAuth } from "@/lib/api-wrapper";
import { readdir, stat, readFile } from "fs/promises";
import path from "path";

const execAsync = promisify(exec);

const BACKUP_DIR = process.env.BACKUP_DIR || "/home/canditos/backups/vetconnect";

export const GET = withAuth(async () => {
  try {
    const backups: Array<{
      name: string;
      size: string;
      date: string;
      path: string;
      components: string[];
    }> = [];
    let lastBackup: {
      timestamp: string;
      file: string;
      size: string;
      totalLocal: number;
      cloudRemote: string;
      nextBackup: string;
      components: string[];
    } | null = null;

    try {
      const files = await readdir(BACKUP_DIR);
      const tarFiles = files.filter(
        (f) => f.startsWith("vetconnect_backup_") && f.endsWith(".tar.gz")
      );

      for (const file of tarFiles.sort().reverse()) {
        const filePath = path.join(BACKUP_DIR, file);
        const stats = await stat(filePath);
        const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);

        backups.push({
          name: file,
          size: `${sizeMB} MB`,
          date: stats.mtime.toISOString(),
          path: filePath,
          components: ["database", "uploads", "configs"],
        });
      }

      // Ler last-backup.json
      try {
        const lastJson = await readFile(
          path.join(BACKUP_DIR, "last-backup.json"),
          "utf-8"
        );
        lastBackup = JSON.parse(lastJson);
      } catch {
        /* no last backup */
      }
    } catch {
      // Diretório de backups não acessível
    }

    return NextResponse.json({
      backups,
      total: backups.length,
      lastBackup,
      backupDir: BACKUP_DIR,
      retentionCount: 2,
      cron: "0 2 */2 * *",
      components: ["database", "uploads", "configs"],
      commands: {
        backup: "./scripts/backup-full.sh",
        restore: "./scripts/restore-full.sh <backup.tar.gz>",
      },
      cloud: {
        configured: !!process.env.CLOUD_REMOTE,
        remote: process.env.CLOUD_REMOTE || null,
      },
    });
  } catch (error) {
    console.error("[BACKUP_LIST]", error);
    return NextResponse.json(
      { error: "Erro ao listar backups" },
      { status: 500 }
    );
  }
});

export const POST = withAuth(async ({ req }) => {
  try {
    const body = await req.json().catch(() => ({}));
    const { type = "manual" } = body;

    const dbContainer = process.env.DB_CONTAINER || "wjmxjm6fcy47sb7g0qg6a472";
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `vetconnect_backup_${timestamp}.tar.gz`;
    const backupPath = path.join(BACKUP_DIR, filename);

    // Criar backup
    const { stdout, stderr } = await execAsync(
      `./scripts/backup-full.sh`,
      { env: { ...process.env, BACKUP_DIR } }
    );

    const stats = await stat(backupPath).catch(() => null);
    const sizeMB = stats ? (stats.size / (1024 * 1024)).toFixed(2) : "0";

    return NextResponse.json({
      success: true,
      file: filename,
      size: `${sizeMB} MB`,
      path: backupPath,
      type,
      timestamp: new Date().toISOString(),
      components: ["database", "uploads", "configs"],
      log: stdout,
      error: stderr || null,
    });
  } catch (error) {
    console.error("[BACKUP_MANUAL]", error);
    return NextResponse.json(
      {
        error: "Erro ao fazer backup.",
        hint: "Verifica se os scripts existem e se o container PostgreSQL está a correr.",
      },
      { status: 500 }
    );
  }
});
