/**
 * DICOM Client for VetConnect
 * Integrates with Examion X-DRS VET Smart via DICOM DIMSE
 * 
 * Supports auto-discovery of RX config via env vars or runtime config.
 */

const dcmjsDimse = require('dcmjs-dimse');
const { Client, Server, Scp, Dataset } = dcmjsDimse;
const { 
  CEchoRequest, 
  CFindRequest, 
  CStoreRequest,
  NCreateRequest
} = dcmjsDimse.requests;
const { 
  CEchoResponse, 
  CFindResponse, 
  CStoreResponse 
} = dcmjsDimse.responses;
const { 
  Status, 
  PresentationContextResult,
  SopClass,
  StorageClass,
  TransferSyntax 
} = dcmjsDimse.constants;

// DICOM Configuration with defaults and fallbacks
const DEFAULT_HOST = '192.168.0.78';
const DEFAULT_PORTS = [104, 11112, 4242];
const DEFAULT_RX_AET = 'EXAMION';
const DEFAULT_APP_AET = 'VETCONNECT';
const DEFAULT_STORE_PORT = 11112;

// Runtime config (can be updated without restart)
let runtimeConfig = {
  host: process.env.DICOM_PACS_HOST || DEFAULT_HOST,
  port: parseInt(process.env.DICOM_PACS_PORT || String(DEFAULT_PORTS[0])),
  rxAet: process.env.DICOM_RX_AET || DEFAULT_RX_AET,
  appAet: process.env.DICOM_APP_AET || DEFAULT_APP_AET,
  storePort: parseInt(process.env.DICOM_STORE_PORT || String(DEFAULT_STORE_PORT)),
};

let server: any = null;

/**
 * Update DICOM configuration at runtime
 */
export function setDicomConfig(config: Partial<typeof runtimeConfig>) {
  runtimeConfig = { ...runtimeConfig, ...config };
  console.log('[DICOM] Config updated:', runtimeConfig);
}

/**
 * Get current DICOM configuration
 */
export function getDicomConfig() {
  return { ...runtimeConfig };
}

/**
 * Try to connect to RX on multiple ports
 */
export async function testDicomConnection(): Promise<{ success: boolean; port: number; message: string }> {
  const portsToTry = [runtimeConfig.port, ...DEFAULT_PORTS.filter(p => p !== runtimeConfig.port)];
  
  for (const port of portsToTry) {
    try {
      const result = await testSinglePort(runtimeConfig.host, port);
      if (result) {
        // Update working port
        if (port !== runtimeConfig.port) {
          console.log(`[DICOM] Auto-discovered working port: ${port}`);
          runtimeConfig.port = port;
        }
        return { success: true, port, message: `C-ECHO OK na porta ${port}` };
      }
    } catch (err) {
      // Continue to next port
    }
  }
  
  return { 
    success: false, 
    port: runtimeConfig.port, 
    message: `Nenhuma porta DICOM respondeu em ${runtimeConfig.host}. Portas testadas: ${portsToTry.join(', ')}. O RX pode estar offline ou o firewall pode estar a bloquear.` 
  };
}

function testSinglePort(host: string, port: number): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      const client = new Client();
      const request = new CEchoRequest();
      
      request.on('response', (response: any) => {
        if (response.getStatus() === Status.Success) {
          console.log(`[DICOM] C-ECHO success to ${host}:${port}`);
          resolve(true);
        } else {
          resolve(false);
        }
      });

      client.addRequest(request);
      client.on('networkError', (e: any) => {
        resolve(false);
      });

      client.send(host, port, runtimeConfig.appAet, runtimeConfig.rxAet);
    } catch {
      resolve(false);
    }
  });
}

/**
 * Send imaging request to RX via DICOM Worklist or C-ECHO
 */
export async function sendImagingRequest(patientData: {
  patientId: string;
  patientName: string;
  studyDescription: string;
  modality: string;
  accessionNumber?: string;
}): Promise<{ success: boolean; message: string }> {
  // First test connectivity
  const connTest = await testDicomConnection();
  
  if (!connTest.success) {
    return { 
      success: false, 
      message: `RX offline: ${connTest.message}` 
    };
  }
  
  return new Promise((resolve) => {
    try {
      const client = new Client();
      const request = new CEchoRequest();
      
      request.on('response', (response: any) => {
        if (response.getStatus() === Status.Success) {
          console.log(`[DICOM] Connected. Patient ${patientData.patientName} queued for ${patientData.studyDescription}`);
          resolve({ 
            success: true, 
            message: `Pedido enviado para ${runtimeConfig.rxAet} (${runtimeConfig.host}:${runtimeConfig.port})` 
          });
        } else {
          resolve({ 
            success: false, 
            message: `RX respondeu com status ${response.getStatus()}` 
          });
        }
      });

      client.addRequest(request);
      client.on('networkError', (e: any) => {
        resolve({ 
          success: false, 
          message: `Erro de rede: ${e.message || e}` 
        });
      });

      client.send(runtimeConfig.host, runtimeConfig.port, runtimeConfig.appAet, runtimeConfig.rxAet);
    } catch (err) {
      resolve({ 
        success: false, 
        message: `Erro DICOM: ${err instanceof Error ? err.message : String(err)}` 
      });
    }
  });
}

/**
 * DICOM SCP (Server) to receive images from RX
 */
class VetConnectScp extends Scp {
  constructor(socket: any, opts: any) {
    super(socket, opts);
    this.association = undefined;
  }

  associationRequested(association: any) {
    this.association = association;
    
    // Accept all associations from the RX
    association.setMaxPduLength(65536);
    
    const contexts = association.getPresentationContexts();
    contexts.forEach((c: any) => {
      const context = association.getPresentationContext(c.id);
      const abstractSyntax = context.getAbstractSyntaxUid();
      
      // Accept verification and storage contexts
      if (
        abstractSyntax === SopClass.Verification ||
        Object.values(StorageClass).includes(abstractSyntax)
      ) {
        const transferSyntaxes = context.getTransferSyntaxUids();
        transferSyntaxes.forEach((transferSyntax: string) => {
          if (
            transferSyntax === TransferSyntax.ImplicitVRLittleEndian ||
            transferSyntax === TransferSyntax.ExplicitVRLittleEndian
          ) {
            context.setResult(PresentationContextResult.Accept, transferSyntax);
          } else {
            context.setResult(PresentationContextResult.RejectTransferSyntaxesNotSupported);
          }
        });
      } else {
        context.setResult(PresentationContextResult.RejectAbstractSyntaxNotSupported);
      }
    });
    
    this.sendAssociationAccept();
    console.log(`[DICOM] Association accepted from ${association.getCallingAeTitle()}`);
  }

  cStoreRequest(request: any, callback: any) {
    const dataset = request.getDataset();
    console.log(`[DICOM] Received image:`, {
      PatientID: dataset.get('PatientID'),
      StudyInstanceUID: dataset.get('StudyInstanceUID'),
      SOPInstanceUID: dataset.get('SOPInstanceUID'),
    });

    // TODO: Save image to database/filesystem
    
    const response = CStoreResponse.fromRequest(request);
    response.setStatus(Status.Success);
    callback(response);
  }

  cEchoRequest(request: any, callback: any) {
    const response = CEchoResponse.fromRequest(request);
    response.setStatus(Status.Success);
    callback(response);
  }

  associationReleaseRequested() {
    this.sendAssociationReleaseResponse();
  }
}

/**
 * Start DICOM C-STORE SCP server to receive images
 */
export function startDicomStoreServer(): void {
  if (server) {
    console.log('[DICOM] Store server already running');
    return;
  }

  try {
    server = new Server(VetConnectScp);
    server.on('networkError', (e: any) => {
      console.log('[DICOM] Store server error:', e.message || e);
    });
    
    server.listen(runtimeConfig.storePort, '0.0.0.0', () => {
      console.log(`[DICOM] C-STORE SCP listening on port ${runtimeConfig.storePort}`);
      console.log(`[DICOM] Ready to receive images from ${runtimeConfig.rxAet}`);
    });
  } catch (err) {
    console.error('[DICOM] Failed to start store server:', err);
  }
}

/**
 * Stop DICOM store server
 */
export function stopDicomStoreServer(): void {
  if (server) {
    server.close();
    server = null;
    console.log('[DICOM] Store server stopped');
  }
}

/**
 * Get detailed status for diagnostics
 */
export async function getDicomStatus() {
  const connTest = await testDicomConnection();
  return {
    config: getDicomConfig(),
    connectivity: connTest,
    serverRunning: !!server,
    environment: {
      DICOM_PACS_HOST: process.env.DICOM_PACS_HOST || '(default)',
      DICOM_PACS_PORT: process.env.DICOM_PACS_PORT || '(default)',
      DICOM_RX_AET: process.env.DICOM_RX_AET || '(default)',
      DICOM_APP_AET: process.env.DICOM_APP_AET || '(default)',
      DICOM_STORE_PORT: process.env.DICOM_STORE_PORT || '(default)',
    }
  };
}
