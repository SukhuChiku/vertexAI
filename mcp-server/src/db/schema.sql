-- ============================================
-- VERTEX INVENTORY DATABASE SCHEMA
-- ============================================

-- Parts/Components Master Table
CREATE TABLE IF NOT EXISTS parts (
    id SERIAL PRIMARY KEY,
    part_number VARCHAR(100) UNIQUE NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) NOT NULL, -- 'jig', 'fixture', 'component', 'raw_material', 'tool'
    unit_of_measure VARCHAR(20) NOT NULL, -- 'pieces', 'kg', 'meters', 'liters'
    current_stock DECIMAL(10,2) DEFAULT 0 CHECK (current_stock >= 0),
    reorder_point DECIMAL(10,2) DEFAULT 0 CHECK (reorder_point >= 0),
    reorder_quantity DECIMAL(10,2) DEFAULT 0 CHECK (reorder_quantity >= 0),
    lead_time_days INTEGER DEFAULT 30 CHECK (lead_time_days >= 0),
    unit_cost DECIMAL(10,2),
    location VARCHAR(100),
    is_critical BOOLEAN DEFAULT false, -- Flag for critical parts
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inventory Transactions (Stock movements)
CREATE TABLE IF NOT EXISTS inventory_transactions (
    id SERIAL PRIMARY KEY,
    part_id INTEGER NOT NULL REFERENCES parts(id) ON DELETE CASCADE,
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('receipt', 'issue', 'adjustment', 'return')),
    quantity DECIMAL(10,2) NOT NULL,
    balance_after DECIMAL(10,2) NOT NULL, -- Stock level after this transaction
    reference_number VARCHAR(100), -- PO number, work order, etc.
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100) DEFAULT 'system'
);

-- Consumption History (for demand forecasting)
CREATE TABLE IF NOT EXISTS consumption_history (
    id SERIAL PRIMARY KEY,
    part_id INTEGER NOT NULL REFERENCES parts(id) ON DELETE CASCADE,
    consumed_quantity DECIMAL(10,2) NOT NULL CHECK (consumed_quantity > 0),
    consumption_date DATE NOT NULL,
    work_order VARCHAR(100),
    machine_id VARCHAR(50), -- Which machine used this part
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_parts_part_number ON parts(part_number);
CREATE INDEX IF NOT EXISTS idx_parts_category ON parts(category);
CREATE INDEX IF NOT EXISTS idx_parts_current_stock ON parts(current_stock);
CREATE INDEX IF NOT EXISTS idx_parts_is_critical ON parts(is_critical);

CREATE INDEX IF NOT EXISTS idx_inventory_transactions_part_id ON inventory_transactions(part_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_created_at ON inventory_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_type ON inventory_transactions(transaction_type);

CREATE INDEX IF NOT EXISTS idx_consumption_history_part_id ON consumption_history(part_id);
CREATE INDEX IF NOT EXISTS idx_consumption_history_date ON consumption_history(consumption_date);
CREATE INDEX IF NOT EXISTS idx_consumption_history_part_date ON consumption_history(part_id, consumption_date);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-update updated_at
CREATE TRIGGER update_parts_updated_at BEFORE UPDATE ON parts
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- View for low stock items
CREATE OR REPLACE VIEW low_stock_items AS
SELECT 
    p.*,
    CASE 
        WHEN p.current_stock = 0 THEN 'OUT_OF_STOCK'
        WHEN p.current_stock <= (p.reorder_point * 0.5) THEN 'CRITICAL'
        WHEN p.current_stock <= p.reorder_point THEN 'LOW'
        ELSE 'ADEQUATE'
    END as stock_status,
    ROUND((p.current_stock / NULLIF(p.reorder_point, 0) * 100), 2) as stock_percentage
FROM parts p
WHERE p.current_stock <= p.reorder_point
ORDER BY stock_percentage ASC;

COMMENT ON TABLE parts IS 'Master table for all inventory parts including jigs, fixtures, and components';
COMMENT ON TABLE inventory_transactions IS 'All stock movement transactions';
COMMENT ON TABLE consumption_history IS 'Historical consumption data for demand forecasting';
COMMENT ON VIEW low_stock_items IS 'Real-time view of parts below reorder point';