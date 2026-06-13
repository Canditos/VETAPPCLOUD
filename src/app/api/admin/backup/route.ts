export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import { withAuth } from "@/lib/api-wrapper";
import { readdir, stat, readFile } from "fs/promises";
import path from "path";

const execAsync = promisify(exec);

const BACKUP_DIR = process.env.BACKUP_DIR || "/backups";

export const GET = withAuth(async () => {
  try {
    const backups: Array<{ name: string; size: string; date: string; path: string }> = [];
    let lastBackup: { date: string; file: string; size: string; total: number } | null = null;
    
    try {
      const files = await readdir(BACKUP_DIR);
      const sqlFiles = files.filter(f => f.startsWith("vetconnect_backup_") && f.endsWith(".sql.gz"));
      
      for (const file of sqlFiles.sort().reverse()) {
        const filePath = path.join(BACKUP_DIR, file);
        const stats = await stat(filePath);
        const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
        backups.push({
          name: file,
          size: `${sizeMB} MB`,
          date: stats.mtime.toISOString(),
          path: filePath,
        });
      }
      
      // Ler last-backup.json se existir
      try {
        const lastJson = await readFile(path.join(BACKUP_DIR, "last-backup.json"), "utf-8");
        lastBackup = JSON.parse(lastJson);
      } catch { /* no last backup */ }
      
    } catch {
      // Diretório de backups não acessível
    }
    
    return NextResponse.json({
      backups,
      total: backups.length,
      lastBackup,
      backupDir: BACKUP_DIR,
      retentionDays: 2,
      cron: "0 2 */2 * *",
      commands: {
        backup: "docker exec -it wjmxjm6fcy47sb7g0qg6a472 pg_dump -U postgres postgres | gzip > vetconnect_backup_$(date +%Y%m%d_%H%M%S).sql.gz",
        restore: "gunzip < backup.sql.gz | docker exec -i wjmxjm6fcy47sb7g0qg6a472 psql -U postgres postgres",
      },
    });
  } catch (error) {
    console.error("[BACKUP_LIST]", error);
    return NextResponse.json({ error: "Erro ao listar backups" }, { status: 500 });
  }
});

export const POST = withAuth(async ({ req }) => {
  try {
    const body = await req.json().catch(() => ({}));
    const { type = "manual" } = body;
    
    // Fazer backup via docker exec
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `vetconnect_backup_${timestamp}.sql.gz`;
    const backupPath = path.join(BACKUP_DIR, filename);
    
    const dbContainer = process.env.DB_CONTAINER || "wjmxjm6fcy47sb7g0qg6a472";
    
    await execAsync(
      `docker exec -i ${dbContainer} pg_dump -U postgres postgres | gzip > ${backupPath}`
    );
    
    const stats = await stat(backupPath);
    const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    
    return NextResponse.json({
      success: true,
      file: filename,
      size: `${sizeMB} MB`,
      path: backupPath,
      type,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[BACKUP_MANUAL]", error);
    return NextResponse.json({ 
      error: "Erro ao fazer backup. Verifica se o container PostgreSQL está a correr e se a diretoria /backups está acessível.",
      hint: "Certifica-te de que o volume /backups está montado no container."
    }, { status: 500 });
  }
});
