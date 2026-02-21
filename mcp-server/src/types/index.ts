export interface Part {
  id: number;
  part_number: string;
  description: string;
  category: string;
  unit_of_measure: string;
  current_stock: number;
  reorder_point: number;
  reorder_quantity: number;
  lead_time_days: number;
  unit_cost: number;
  location: string;
  is_critical: boolean;
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

export interface InventoryTransaction {
  id: number;
  part_id: number;
  transaction_type: 'receipt' | 'issue' | 'adjustment' | 'return';
  quantity: number;
  balance_after: number;
  reference_number?: string;
  notes?: string;
  created_at: Date;
  created_by: string;
}

export interface ConsumptionHistory {
  id: number;
  part_id: number;
  consumed_quantity: number;
  consumption_date: string;
  work_order?: string;
  machine_id?: string;
  notes?: string;
  created_at: Date;
}

export interface LowStockItem extends Part {
  stock_status: 'OUT_OF_STOCK' | 'CRITICAL' | 'LOW' | 'ADEQUATE';
  stock_percentage: number;
}

export interface ConsumptionSummary {
  part_number: string;
  part_description: string;
  total_consumed: number;
  avg_daily_consumption: number;
  avg_weekly_consumption: number;
  avg_monthly_consumption: number;
  days_analyzed: number;
  estimated_days_until_stockout?: number;
}