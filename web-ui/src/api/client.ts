const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface ChatResponse {
  success: boolean;
  data?: {
    session_id: string;
    message: string;
  };
  error?: string;
}

export interface Alert {
  id: number;
  alert_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  part_number: string;
  part_description?: string;
  current_stock?: number;
  reorder_point?: number;
  stock_percentage?: number;
  message: string;
  recommendation?: string;
  acknowledged: boolean;
  created_at: string;
}

export const api = {
  async sendMessage(message: string, sessionId?: string): Promise<ChatResponse> {
    const response = await fetch(`${API_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        session_id: sessionId,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  },

  async getAlerts(): Promise<Alert[]> {
    const response = await fetch(`${API_URL}/api/alerts`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.data || [];
  },

  async acknowledgeAlert(alertId: number): Promise<void> {
    const response = await fetch(`${API_URL}/api/alerts/${alertId}/acknowledge`, {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  },
};