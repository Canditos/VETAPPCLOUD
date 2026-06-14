/**
 * VetApp Cloud - Pi Lab Bridge
 * 
 * Este script deve correr no Raspberry Pi (via PM2 ou Systemd).
 * Ele escuta nas portas locais TCP (HL7 e ASTM) das máquinas de análises (Fuji, Exigo, Dri-chem).
 * Quando recebe resultados, traduz e envia para a Cloud via API REST.
 * 
 * Dependências necessárias (npm install):
 * npm install axios hl7-standard
 */

const net = require('net');
const axios = require('axios');
const fs = require('fs');
const HL7 = require('hl7-standard');

// ==========================================
// CONFIGURAÇÕES
// ==========================================
const CLOUD_API_URL = process.env.CLOUD_API_URL || 'https://coolify.gatoescondido.com/api/integrations/lab';
const CLOUD_API_SECRET = process.env.CLOUD_API_SECRET || 'SEU_SEGREDO_AQUI'; // O WEBHOOK_SECRET do .env da cloud
const CLINIC_ID = process.env.CLINIC_ID || 'ID_DA_CLINICA_AQUI';

const PORTS = {
  FUJI: 5001,
  EXIGO: 5002,
  DRICHEM: 5003
};

// ==========================================
// FUNÇÕES DE ENVIO PARA A NUVEM
// ==========================================
async function sendToCloud(patientId, source, parameters, abnormalFlags = false) {
  try {
    console.log(`[+] A enviar resultados do paciente ${patientId} (Origem: ${source}) para a Cloud...`);
    
    const payload = {
      clinicId: CLINIC_ID,
      patientId, // Microchip ou ID do paciente que vem na máquina
      source,
      abnormalFlags,
      dataJson: {
        parameters
      }
    };

    const response = await axios.post(CLOUD_API_URL, payload, {
      headers: {
        'Authorization': `Bearer ${CLOUD_API_SECRET}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`[SUCCESS] Resultados enviados. ID LabResult: ${response.data.labResultId}`);
  } catch (error) {
    console.error(`[ERROR] Falha ao enviar para a Cloud:`, error.message);
    if (error.response) {
      console.error(`[ERROR DETAILS]:`, error.response.data);
    }
    // TODO: Adicionar lógica para guardar em ficheiro local (.json) e tentar novamente mais tarde (Retry/Queue)
  }
}

// ==========================================
// SERVIDORES TCP LOCAIS
// ==========================================

// 1. FUJI DX (HL7)
const fujiServer = net.createServer((socket) => {
  console.log('[FUJI] Cliente conectado:', socket.remoteAddress);
  let buffer = '';

  socket.on('data', async (data) => {
    buffer += data.toString('utf-8');
    
    // Simplificação de processamento HL7 (Exige parser HL7 MLLP robusto na prática)
    try {
      const hl7 = new HL7(buffer);
      hl7.transform();
      
      const pid = hl7.getSegment('PID');
      const patientId = pid.get('PID.3'); // Exemplo
      
      const obxSegments = hl7.getSegments('OBX');
      const parameters = obxSegments.map(obx => {
        return {
          name: obx.get('OBX.3'),
          value: parseFloat(obx.get('OBX.5')),
          unit: obx.get('OBX.6'),
          isAbnormal: obx.get('OBX.8') !== 'N' // N = Normal
        };
      });

      const hasAbnormal = parameters.some(p => p.isAbnormal);

      await sendToCloud(patientId, 'FUJI', parameters, hasAbnormal);
      
      // Enviar ACK de volta (HL7)
      socket.write(hl7.buildACK('AA'));
      buffer = '';
    } catch (e) {
      // Aguardar mais pacotes ou ignorar se não for mensagem completa
    }
  });

  socket.on('error', (err) => console.error('[FUJI] Erro:', err));
});

// Arrancar servidores
fujiServer.listen(PORTS.FUJI, '0.0.0.0', () => {
  console.log(`[PI-BRIDGE] Servidor FUJI HL7 a escutar na porta ${PORTS.FUJI}`);
});

// NOTA: Para EXIGO e DRICHEM (ASTM), a estrutura é parecida mas usando pacotes LIS/ASTM E1394.
// Adicionar servidores idênticos baseados no mesmo `net.createServer` mas com parser ASTM.
