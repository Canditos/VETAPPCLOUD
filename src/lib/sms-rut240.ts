import axios from 'axios';
import prisma from '@/lib/prisma';

const MIN_DELAY_MS = 5000;
const DEFAULT_PORT = 80;

type RUT240Config = {
  ip: string;
  port: number;
  username: string;
  password: string;
};

const queue: Array<{
  numero: string;
  mensagem: string;
  resolve: (value: any) => void;
  reject: (reason?: any) => void;
}> = [];

let processing = false;

function isConfigured(value: string | null | undefined): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function parsePort(value: string | number | null | undefined): number {
  const parsed = Number(value ?? DEFAULT_PORT);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : DEFAULT_PORT;
}

function maskPhoneNumber(numero: string) {
  if (numero.length <= 4) return numero;
  return `${numero.slice(0, 4)}***${numero.slice(-2)}`;
}

function buildConfig(config: {
  ip?: string | null;
  port?: string | number | null;
  username?: string | null;
  password?: string | null;
}): RUT240Config | null {
  if (!isConfigured(config.ip) || !isConfigured(config.username) || !isConfigured(config.password)) {
    return null;
  }

  return {
    ip: config.ip.trim(),
    port: parsePort(config.port),
    username: config.username.trim(),
    password: config.password,
  };
}

async function getRUT240Config(clinicId?: string): Promise<RUT240Config | null> {
  if (clinicId) {
    try {
      const settings = await prisma.automationSettings.findUnique({
        where: { clinicId }
      });
      const clinicConfig = buildConfig({
        ip: settings?.rut240Ip,
        port: settings?.rut240Port,
        username: settings?.rut240User,
        password: settings?.rut240Password,
      });
      if (clinicConfig) {
        return clinicConfig;
      }
    } catch {}
  }

  return buildConfig({
    ip: process.env.RUT240_IP || process.env.TELTONIKA_HOST,
    port: process.env.RUT240_PORT || process.env.TELTONIKA_PORT,
    username: process.env.RUT240_USER || process.env.TELTONIKA_USER,
    password: process.env.RUT240_PASSWORD || process.env.TELTONIKA_PASS,
  });
}

export async function sendSMSViaRUT240(
  numero: string,
  mensagem: string,
  clinicId?: string,
  forceUseConfig?: boolean
): Promise<{ success: boolean; message: string }> {
  return new Promise(async (resolve, reject) => {
    if (!numero || !mensagem) {
      return reject(new Error('Número e mensagem são obrigatórios'));
    }

    if (clinicId) {
      try {
        const settings = await prisma.automationSettings.findUnique({
          where: { clinicId }
        });
        if (!forceUseConfig && (!settings || !settings.rut240Enabled || !settings.rut240Ip)) {
          return reject(new Error('Gateway RUT240 não está ativado ou não tem o endereço IP configurado nas definições da clínica.'));
        }
      } catch (err) {
        return reject(err);
      }
    }

    let formattedNumber = numero.replace(/\s+/g, '');
    if (!formattedNumber.startsWith('+') && !formattedNumber.startsWith('00')) {
      if (formattedNumber.length === 9 && (formattedNumber.startsWith('9') || formattedNumber.startsWith('2'))) {
        formattedNumber = '+351' + formattedNumber;
      }
    }

    const config = await getRUT240Config(clinicId);
    if (!config) {
      return reject(
        new Error('Gateway RUT240 não configurado. Defina IP, utilizador e password nas definições da clínica ou nas variáveis RUT240_*.')
      );
    }

    queue.push({ numero: formattedNumber, mensagem, resolve, reject });
    console.log(`[RUT240] Adicionado à fila: ${maskPhoneNumber(formattedNumber)} (fila: ${queue.length})`);
    processarFila(config);
  });
}

async function processarFila(config: RUT240Config) {
  if (processing || queue.length === 0) return;
  processing = true;

  while (queue.length > 0) {
    const item = queue.shift();
    if (!item) continue;

    const { numero, mensagem, resolve, reject } = item;
    try {
      const resultado = await _enviarParaRouter(numero, mensagem, config);
      resolve(resultado);
    } catch (err: any) {
      console.error(`[RUT240] Erro ao enviar para ${maskPhoneNumber(numero)}:`, err.message);
      reject(err);
    }

    if (queue.length > 0) {
      await new Promise((res) => setTimeout(res, MIN_DELAY_MS));
    }
  }

  processing = false;
}

async function _enviarParaRouter(numero: string, mensagem: string, config: { ip: string; username: string; password: string }) {
  const url = `http://${config.ip}:${config.port}/cgi-bin/sms_send`;

  const params = {
    username: config.username,
    password: config.password,
    number: numero,
    text: mensagem,
  };

  console.log(`[RUT240] A tentar enviar SMS para ${maskPhoneNumber(numero)}...`);

  try {
    const resposta = await axios.get(url, {
      params,
      timeout: 10000,
    });

    const data = resposta.data?.toString().trim();

    if (data && data.includes('OK')) {
      console.log(`[RUT240] ✓ Sucesso: ${maskPhoneNumber(numero)}`);
      return { success: true, message: `SMS enviado via RUT240 para ${numero}` };
    } else {
      throw new Error(`Router respondeu: ${data || 'Sem resposta'}`);
    }
  } catch (error: any) {
    if (error.code === 'ECONNREFUSED') {
      throw new Error(`Não foi possível ligar ao RUT240 em ${config.ip}:${config.port}. Verifica se estás na mesma rede.`);
    }
    throw error;
  }
}
