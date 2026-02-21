export interface Conversation {
  id: number;
  session_id: string;
  user_id?: string;
  title?: string;
  started_at: Date;
  last_activity: Date;
  is_active: boolean;
}

export interface Message {
  id: number;
  conversation_id: number;
  role: 'user' | 'assistant' | 'system';
  content: string;
  tool_calls?: any;
  created_at: Date;
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
  estimated_days_to_stockout?: number;
  message: string;
  recommendation?: string;
  auto_generated: boolean;
  acknowledged: boolean;
  acknowledged_by?: string;
  acknowledged_at?: Date;
  created_at: Date;
  expires_at?: Date;
}

export interface ChatRequest {
  session_id?: string;
  message: string;
  user_id?: string;
}

export interface ChatResponse {
  session_id: string;
  message: string;
  conversation_id: number;
}