/**
 * GDT (Geratedatentransfer) Client for VetConnect
 * Integrates with Examion X-DRS VET Smart via file-based GDT interface.
 *
 * GDT Types:
 *   6302 — Worklist Request / "Fazer RX" (PDMS → Examion)
 *   6311 — Show Archived Images / "Ver RX" (PDMS → Examion)
 *   6310 — Return Data Set (Examion → PDMS)
 *
 * File format:
 *   - Encoding: ANSI (Latin-1 / windows-1252) for Portuguese accents
 *   - Line: <000><TAG><content><CR><LF> (checksums always 000)
 *   - First line: 00080006302 or 00080006311
 *   - Output file: mgpcs.gdt
 *   - Saves to client Downloads folder
 *
 * Reference: examion_GDT_interface_veterinary.pdf (Rev. 3, 2013)
 */

import { Buffer } from "buffer";
import fs from "fs";
import path from "path";

// ---------------------------------------------------------------------------
// GDT Data Types
// ---------------------------------------------------------------------------

export interface GdtPatientData {
  patientId: string;
  species?: string;
  name: string;
  breed?: string;
  birthDate?: Date | string | null;
  coatColor?: string;
  gender?: string | null;
  officialName?: string;
  neutered?: boolean | null;
  microchip?: string | null;
  tattooLeft?: string;
  tattooRight?: string;
  breedingId?: string;
  ring?: string;
  sire?: string;
}

export interface GdtOwnerData {
  ownerId: string;
  lastName?: string;
  firstName?: string;
  academicTitle?: string;
  zipCode?: string;
  city?: string;
  street?: string;
  phone?: string;
  email?: string;
}

export type GdtModality = "XRAY01" | "DICO01";

export interface GdtWorklistRequest {
  patient: GdtPatientData;
  owner?: GdtOwnerData;
  modality?: GdtModality;
}

export interface GdtViewerRequest {
  patientId: string;
  patientName: string;
  species?: string;
}

// ---------------------------------------------------------------------------
// GDT Line Builder (checksums always 000 per Examion spec)
// ---------------------------------------------------------------------------

function buildLine(tag: string, content: string): string {
  return `000${tag}${content}\r\n`;
}

function buildGdtFile(type: "6302" | "6311", lines: string[]): string {
  const header = buildLine("8000", type);
  return header + lines.join("");
}

// ---------------------------------------------------------------------------
// Date Helpers
// ---------------------------------------------------------------------------

function formatGdtDate(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "";
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = String(d.getFullYear());
  return `${day}${month}${year}`;
}

// ---------------------------------------------------------------------------
// Gender Mapping (1 = Masculino, 2 = Feminino)
// ---------------------------------------------------------------------------

function mapGender(gender: string | null | undefined): string {
  if (!gender) return "";
  const g = gender.toUpperCase();
  if (g === "M" || g === "MALE" || g === "MACHO") return "1";
  if (g === "F" || g === "FEMALE" || g === "FEMEA" || g === "FÊMEA") return "2";
  return "";
}

// ---------------------------------------------------------------------------
// Neutered Mapping (1 = Castrado, 0 = Nao castrado)
// ---------------------------------------------------------------------------

function mapNeutered(neutered: boolean | null | undefined): string {
  if (neutered === true) return "1";
  if (neutered === false) return "0";
  return "";
}

// ---------------------------------------------------------------------------
// Truncate helper
// ---------------------------------------------------------------------------

function trunc(value: string | null | undefined, maxLen: number): string {
  if (!value) return "";
  return value.substring(0, maxLen);
}

// ---------------------------------------------------------------------------
// Encode to ANSI (windows-1252 / latin1)
// ---------------------------------------------------------------------------

function encodeAnsi(text: string): Buffer {
  // Convert to Latin-1 (ISO-8859-1 / windows-1252 for basic chars)
  const buf = Buffer.alloc(text.length);
  for (let i = 0; i < text.length; i++) {
    const cp = text.codePointAt(i);
    if (cp !== undefined && cp <= 0xFF) {
      buf[i] = cp;
    } else {
      // Fallback: use char code or '?'
      const cc = text.charCodeAt(i);
      buf[i] = cc > 0xFF ? 0x3F : cc; // '?' for unmappable
    }
  }
  return buf;
}

// ---------------------------------------------------------------------------
// GDT Writer: 6302 — Worklist Request ("Fazer RX")
// ---------------------------------------------------------------------------

export function generateWorklistGdt(data: GdtWorklistRequest): string {
  const { patient, owner, modality } = data;

  const lines: string[] = [];

  // Modality (required)
  lines.push(buildLine("8402", modality || "XRAY01"));

  // Patient ID (required)
  lines.push(buildLine("3000", trunc(patient.patientId, 10)));

  // Patient name (required)
  lines.push(buildLine("3101", trunc(patient.name, 20)));

  if (patient.species) lines.push(buildLine("3100", trunc(patient.species, 15)));
  if (patient.breed) lines.push(buildLine("3102", trunc(patient.breed, 20)));

  const dob = formatGdtDate(patient.birthDate);
  if (dob) lines.push(buildLine("3103", dob));

  if (patient.coatColor) lines.push(buildLine("3104", trunc(patient.coatColor, 12)));
  if (patient.microchip) lines.push(buildLine("3105", trunc(patient.microchip, 20)));

  const gender = mapGender(patient.gender);
  if (gender) lines.push(buildLine("3110", gender));

  if (patient.officialName) lines.push(buildLine("3120", trunc(patient.officialName, 63)));

  const neutered = mapNeutered(patient.neutered);
  if (neutered) lines.push(buildLine("3121", neutered));

  if (patient.tattooLeft) lines.push(buildLine("3122", trunc(patient.tattooLeft, 20)));
  if (patient.tattooRight) lines.push(buildLine("3123", trunc(patient.tattooRight, 20)));
  if (patient.breedingId) lines.push(buildLine("3124", trunc(patient.breedingId, 20)));
  if (patient.ring) lines.push(buildLine("3126", trunc(patient.ring, 20)));
  if (patient.sire) lines.push(buildLine("3127", trunc(patient.sire, 2)));

  // Owner data
  if (owner) {
    if (owner.ownerId) lines.push(buildLine("3200", trunc(owner.ownerId, 20)));
    if (owner.lastName) lines.push(buildLine("3201", trunc(owner.lastName, 20)));
    if (owner.firstName) lines.push(buildLine("3202", trunc(owner.firstName, 20)));
    if (owner.academicTitle) lines.push(buildLine("3204", trunc(owner.academicTitle, 12)));
    if (owner.zipCode) lines.push(buildLine("3205", trunc(owner.zipCode, 10)));
    if (owner.city) lines.push(buildLine("3206", trunc(owner.city, 25)));
    if (owner.street) lines.push(buildLine("3207", trunc(owner.street, 25)));
    if (owner.phone) lines.push(buildLine("3626", trunc(owner.phone, 15)));
    if (owner.email) lines.push(buildLine("3619", trunc(owner.email, 40)));
  }

  return buildGdtFile("6302", lines);
}

// ---------------------------------------------------------------------------
// GDT Writer: 6311 — Show Archived Images ("Ver RX")
// ---------------------------------------------------------------------------

export function generateViewerGdt(data: GdtViewerRequest): string {
  const lines: string[] = [
    buildLine("3000", trunc(data.patientId, 10)),
    buildLine("3101", trunc(data.patientName, 20)),
  ];

  if (data.species) lines.push(buildLine("3100", trunc(data.species, 15)));

  return buildGdtFile("6311", lines);
}

// ---------------------------------------------------------------------------
// GDT Buffer for Download
// ---------------------------------------------------------------------------

export interface GdtDownloadResult {
  filename: string;
  buffer: Buffer;
  encoding: string;
}

/**
 * Create GDT 6302 file as ANSI buffer for download.
 */
export function createWorklistDownload(data: GdtWorklistRequest): GdtDownloadResult {
  const content = generateWorklistGdt(data);
  return {
    filename: "mgpcs.gdt",
    buffer: encodeAnsi(content),
    encoding: "ANSI",
  };
}

/**
 * Create GDT 6311 file as ANSI buffer for download.
 */
export function createViewerDownload(data: GdtViewerRequest): GdtDownloadResult {
  const content = generateViewerGdt(data);
  return {
    filename: "mgpcs.gdt",
    buffer: encodeAnsi(content),
    encoding: "ANSI",
  };
}

// ---------------------------------------------------------------------------
// RX Targets — PCs com software RX instalado
// ---------------------------------------------------------------------------

export interface RxTarget {
  id: string;
  ip: string;
  hostname?: string;
  /** Caminho local (Linux) onde a partilha CIFS está montada */
  mountPath: string;
  /** Pasta relativa dentro da montagem onde escrever o ficheiro */
  subdir: string;
  label: string;
}

const defaultRxTargets: RxTarget[] = [
  {
    id: "gato-escondido",
    ip: "192.168.0.121",
    hostname: "GATO_ESCONDIDO",
    mountPath: "/mnt/gdt121",
    subdir: "UploadRX",
    label: "Gato Escondido (.121)",
  },
];

export function getRxTargets(): RxTarget[] {
  return defaultRxTargets;
}

// ---------------------------------------------------------------------------
// File Operations (auto-write to Samba share / RX targets)
// ---------------------------------------------------------------------------

let gdtConfig = {
  outDir: process.env.GDT_OUT_DIR || "/srv/gdt/gdtin",
  inDir: process.env.GDT_IN_DIR || "/srv/gdt/gdtout",
};

export function setGdtConfig(config: Partial<typeof gdtConfig>) {
  gdtConfig = { ...gdtConfig, ...config };
}

export function getGdtConfig() {
  return { ...gdtConfig };
}

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function isTargetAccessible(target: RxTarget): boolean {
  const fullPath = path.join(target.mountPath, target.subdir);
  try {
    fs.accessSync(fullPath, fs.constants.W_OK);
    return true;
  } catch {
    return false;
  }
}

function writeToTarget(content: string, target: RxTarget, filename = "mgpcs.gdt"): { success: boolean; path?: string; error?: string } {
  try {
    const fullPath = path.join(target.mountPath, target.subdir);
    ensureDir(fullPath);
    const filePath = path.join(fullPath, filename);
    const buf = encodeAnsi(content);
    fs.writeFileSync(filePath, buf);
    console.log(`[GDT] Written to target ${target.label}: ${filePath} (${buf.length} bytes ANSI)`);
    return { success: true, path: filePath };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[GDT] Write to target ${target.label} failed: ${msg}`);
    return { success: false, error: msg };
  }
}

export interface RxWriteResult {
  success: boolean;
  target?: string;
  path?: string;
  error?: string;
  attempts: Array<{ target: string; success: boolean; error?: string }>;
}

/**
 * Tenta escrever o ficheiro GDT nos targets RX online.
 * Varre a lista de targets, testa acesso e escreve no primeiro disponível.
 */
export function writeToOnlineTarget(content: string, filename = "mgpcs.gdt"): RxWriteResult {
  const targets = getRxTargets();
  const attempts: RxWriteResult["attempts"] = [];

  for (const target of targets) {
    if (isTargetAccessible(target)) {
      const result = writeToTarget(content, target, filename);
      attempts.push({ target: target.label, success: result.success, error: result.error });
      if (result.success) {
        return { success: true, target: target.label, path: result.path, attempts };
      }
    } else {
      attempts.push({ target: target.label, success: false, error: "inacessivel (offline ou mount nao disponivel)" });
    }
  }

  return { success: false, error: "Nenhum target RX online", attempts };
}

/**
 * Write GDT file to local disk (gdtin Samba share).
 */
export function writeGdtToDisk(content: string, filename = "mgpcs.gdt"): { success: boolean; path?: string; error?: string } {
  try {
    ensureDir(gdtConfig.outDir);
    const filePath = path.join(gdtConfig.outDir, filename);
    const buf = encodeAnsi(content);
    fs.writeFileSync(filePath, buf);
    console.log(`[GDT] Written: ${filePath} (${buf.length} bytes ANSI)`);
    return { success: true, path: filePath };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[GDT] Write failed: ${msg}`);
    return { success: false, error: msg };
  }
}

/**
 * Auto-send worklist: tenta escrever nos targets RX;
 * se falhar, faz download para o browser.
 */
export function autoSendWorklist(data: GdtWorklistRequest): GdtDownloadResult & { written: boolean; path?: string; target?: string; rxAttempts?: RxWriteResult["attempts"] } {
  const content = generateWorklistGdt(data);
  const buffer = encodeAnsi(content);

  // Tentar escrever num target RX online
  const rxResult = writeToOnlineTarget(content);

  if (rxResult.success) {
    return {
      filename: "mgpcs.gdt",
      buffer,
      encoding: "ANSI",
      written: true,
      path: rxResult.path,
      target: rxResult.target,
      rxAttempts: rxResult.attempts,
    };
  }

  // Fallback: escrever no gdtin local (Samba share)
  const written = writeGdtToDisk(content);
  return {
    filename: "mgpcs.gdt",
    buffer,
    encoding: "ANSI",
    written: written.success,
    path: written.path,
    rxAttempts: rxResult.attempts,
  };
}

/**
 * Auto-send viewer request: tenta escrever nos targets RX;
 * se falhar, faz download para o browser.
 */
export function autoSendViewer(data: GdtViewerRequest): GdtDownloadResult & { written: boolean; path?: string; target?: string; rxAttempts?: RxWriteResult["attempts"] } {
  const content = generateViewerGdt(data);
  const buffer = encodeAnsi(content);

  const rxResult = writeToOnlineTarget(content);

  if (rxResult.success) {
    return {
      filename: "mgpcs.gdt",
      buffer,
      encoding: "ANSI",
      written: true,
      path: rxResult.path,
      target: rxResult.target,
      rxAttempts: rxResult.attempts,
    };
  }

  const written = writeGdtToDisk(content);
  return {
    filename: "mgpcs.gdt",
    buffer,
    encoding: "ANSI",
    written: written.success,
    path: written.path,
    rxAttempts: rxResult.attempts,
  };
}

/**
 * Check if GDT directories are accessible.
 */
export function checkGdtStatus() {
  return {
    outDir: gdtConfig.outDir,
    inDir: gdtConfig.inDir,
    outDirOk: fs.existsSync(gdtConfig.outDir),
    inDirOk: fs.existsSync(gdtConfig.inDir),
  };
}

/**
 * Poll for return data from Examion RX.
 * Reads pcsmg.* files from gdtout directory.
 */
export function pollReturnFiles(options?: { deleteAfterRead?: boolean }) {
  const results: Array<{ fileName: string; content: string; patientId?: string; patientName?: string }> = [];

  try {
    if (!fs.existsSync(gdtConfig.inDir)) return results;

    const files = fs.readdirSync(gdtConfig.inDir)
      .filter((f) => f.startsWith("pcsmg."))
      .sort();

    for (const file of files) {
      const filePath = path.join(gdtConfig.inDir, file);
      try {
        const content = fs.readFileSync(filePath, "latin1");
        const pId = content.match(/0003000(.{1,10})/)?.[1]?.trim();
        const pName = content.match(/0003101(.{1,20})/)?.[1]?.trim();

        results.push({
          fileName: file,
          content,
          patientId: pId,
          patientName: pName,
        });

        if (options?.deleteAfterRead) {
          fs.unlinkSync(filePath);
        }
      } catch (err) {
        console.error(`[GDT] Error reading ${file}:`, err);
      }
    }
  } catch (err) {
    console.error(`[GDT] Error scanning ${gdtConfig.inDir}:`, err);
  }

  return results;
}
