import axios from 'axios';

// ─── Configuração ────────────────────────────────────────────────
const RUT240_CONFIG = {
  ip:       process.env.RUT240_IP       || '192.168.1.1',
  username: process.env.RUT240_USER     || 'admin',
  password: process.env.RUT240_PASSWORD || 'admin01', // Password padrão do RUT240 costuma ser admin01 ou definida pelo user
};

// Delay mínimo entre SMS (ms) para evitar problemas no modem
const MIN_DELAY_MS = 5000; // Reduzi para 5s para ser mais ágil, mas podes ajustar

// Fila interna de envio
const queue: Array<{
  numero: string;
  mensagem: string;
  resolve: (value: any) => void;
  reject: (reason?: any) => void;
}> = [];

let processing = false;

/**
 * Adiciona um SMS à fila de envio via Router RUT240.
 */
export function sendSMSViaRUT240(numero: string, mensagem: string): Promise<{ success: boolean; message: string }> {
  return new Promise((resolve, reject) => {
    // Validação básica
    if (!numero || !mensagem) {
      return reject(new Error('Número e mensagem são obrigatórios'));
    }
    
    // Normalização básica do número
    let formattedNumber = numero.replace(/\s+/g, '');
    if (!formattedNumber.startsWith('+') && !formattedNumber.startsWith('00')) {
        // Se for número PT sem prefixo, adiciona
        if (formattedNumber.length === 9 && (formattedNumber.startsWith('9') || formattedNumber.startsWith('2'))) {
            formattedNumber = '+351' + formattedNumber;
        }
    }

    queue.push({ numero: formattedNumber, mensagem, resolve, reject });
    console.log(`[RUT240] Adicionado à fila: ${formattedNumber} (fila: ${queue.length})`);
    processarFila();
  });
}

async function processarFila() {
  if (processing || queue.length === 0) return;
  processing = true;

  while (queue.length > 0) {
    const item = queue.shift();
    if (!item) continue;

    const { numero, mensagem, resolve, reject } = item;
    try {
      const resultado = await _enviarParaRouter(numero, mensagem);
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

async function _enviarParaRouter(numero: string, mensagem: string) {
  // A API do Teltonika RUT240 para envio de SMS via HTTP GET
  // Documentação Teltonika: https://wiki.teltonika-networks.com/view/RUT240_SMS_Gateway
  const url = `http://${RUT240_CONFIG.ip}/cgi-bin/sms_send`;
  
  const params = {
    username: RUT240_CONFIG.username,
    password: RUT240_CONFIG.password,
    number:   numero,
    text:     mensagem,
  };

  console.log(`[RUT240] A tentar enviar SMS para ${numero}...`);

  try {
    const resposta = await axios.get(url, { 
      params, 
      timeout: 10000,
      // Alguns routers exigem que não haja validação de SSL se for IP local, 
      // mas aqui é HTTP simples.
    });

    // O RUT240 devolve "OK" em texto simples em caso de sucesso
    const data = resposta.data?.toString().trim();
    
    if (data && data.includes('OK')) {
      console.log(`[RUT240] ✓ Sucesso: ${numero}`);
      return { success: true, message: `SMS enviado via RUT240 para ${numero}` };
    } else {
      throw new Error(`Router respondeu: ${data || 'Sem resposta'}`);
    }
  } catch (error: any) {
    if (error.code === 'ECONNREFUSED') {
        throw new Error(`Não foi possível ligar ao RUT240 em ${RUT240_CONFIG.ip}. Verifica se estás na mesma rede.`);
    }
    throw error;
  }
}
