import axios from 'axios';
import prisma from '@/lib/prisma';

const MIN_DELAY_MS = 5000;

const queue: Array<{
  numero: string;
  mensagem: string;
  resolve: (value: any) => void;
  reject: (reason?: any) => void;
}> = [];

let processing = false;

async function getRUT240Config(clinicId?: string) {
  if (clinicId) {
    try {
      const settings = await prisma.automationSettings.findUnique({
        where: { clinicId }
      });
      if (settings?.rut240Ip) {
        return {
          ip: settings.rut240Ip,
          username: settings.rut240User || 'admin',
          password: settings.rut240Password || 'admin01',
        };
      }
    } catch {}
  }

  return {
    ip: process.env.RUT240_IP || '192.168.1.1',
    username: process.env.RUT240_USER || 'admin',
    password: process.env.RUT240_PASSWORD || 'admin01',
  };
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

    queue.push({ numero: formattedNumber, mensagem, resolve, reject });
    console.log(`[RUT240] Adicionado à fila: ${formattedNumber} (fila: ${queue.length})`);
    processarFila(config);
  });
}

async function processarFila(config: { ip: string; username: string; password: string }) {
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
      console.error(`[RUT240] Erro ao enviar para ${numero}:`, err.message);
      reject(err);
    }

    if (queue.length > 0) {
      await new Promise((res) => setTimeout(res, MIN_DELAY_MS));
    }
  }

  processing = false;
}

async function _enviarParaRouter(numero: string, mensagem: string, config: { ip: string; username: string; password: string }) {
  const url = `http://${config.ip}/cgi-bin/sms_send`;

  const params = {
    username: config.username,
    password: config.password,
    number: numero,
    text: mensagem,
  };

  console.log(`[RUT240] A tentar enviar SMS para ${numero}...`);

  try {
    const resposta = await axios.get(url, {
      params,
      timeout: 10000,
    });

    const data = resposta.data?.toString().trim();

    if (data && data.includes('OK')) {
      console.log(`[RUT240] ✓ Sucesso: ${numero}`);
      return { success: true, message: `SMS enviado via RUT240 para ${numero}` };
    } else {
      throw new Error(`Router respondeu: ${data || 'Sem resposta'}`);
    }
  } catch (error: any) {
    if (error.code === 'ECONNREFUSED') {
      throw new Error(`Não foi possível ligar ao RUT240 em ${config.ip}. Verifica se estás na mesma rede.`);
    }
    throw error;
  }
}
