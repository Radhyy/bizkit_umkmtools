// WhatsApp Bot Session & Connection State Manager

export interface WhatsAppSessionState {
  status: 'disconnected' | 'waiting_scan' | 'connected';
  phoneNumber: string | null;
  botName: string;
  deviceInfo: string;
  connectedAt: string | null;
  lastPingAt: string | null;
  qrCodeString: string;
  qrExpiresAt: number;
  totalMessagesReceived: number;
  totalTransactionsProcessed: number;
}

// In-memory state for WhatsApp Gateway
let waSession: WhatsAppSessionState = {
  status: 'waiting_scan',
  phoneNumber: null,
  botName: 'Bizkit AI Assistant',
  deviceInfo: 'WhatsApp Web (Chrome / Windows)',
  connectedAt: null,
  lastPingAt: new Date().toISOString(),
  qrCodeString: `BIZKIT-WA-AUTH-${Date.now()}-SECURE-TOKEN`,
  qrExpiresAt: Date.now() + 60000,
  totalMessagesReceived: 0,
  totalTransactionsProcessed: 0,
};

export function getWhatsAppSession(): WhatsAppSessionState {
  // Cek apakah QR kedaluwarsa jika statusnya masih waiting_scan
  if (waSession.status === 'waiting_scan' && Date.now() > waSession.qrExpiresAt) {
    refreshWhatsAppQR();
  }
  return { ...waSession };
}

export function refreshWhatsAppQR(): string {
  waSession.status = 'waiting_scan';
  waSession.qrCodeString = `BIZKIT-WA-AUTH-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
  waSession.qrExpiresAt = Date.now() + 60000; // 60 detik
  return waSession.qrCodeString;
}

export function simulateConnect(phoneNumber: string = '+62 821-4567-8900'): WhatsAppSessionState {
  waSession.status = 'connected';
  waSession.phoneNumber = phoneNumber;
  waSession.connectedAt = new Date().toISOString();
  waSession.lastPingAt = new Date().toISOString();
  return { ...waSession };
}

export function disconnectWhatsApp(): WhatsAppSessionState {
  waSession.status = 'disconnected';
  waSession.phoneNumber = null;
  waSession.connectedAt = null;
  return { ...waSession };
}

export function incrementMessageCounter(isTransaction: boolean = false) {
  waSession.totalMessagesReceived++;
  if (isTransaction) waSession.totalTransactionsProcessed++;
  waSession.lastPingAt = new Date().toISOString();
}
