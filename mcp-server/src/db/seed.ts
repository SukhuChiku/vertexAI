import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'vertex',
  password: process.env.DB_PASSWORD || 'vertex_password',
  database: process.env.DB_NAME || 'vertex_inventory',
});

// Sample mechanical parts data
const sampleParts = [
  // Jigs
  { part_number: 'JIG-001', description: 'Welding Jig - Frame Assembly', category: 'jig', unit_of_measure: 'pieces', current_stock: 5, reorder_point: 3, reorder_quantity: 5, lead_time_days: 45, unit_cost: 1250.00, location: 'Tool Crib A', is_critical: true },
  { part_number: 'JIG-002', description: 'Drilling Jig - Motor Mount', category: 'jig', unit_of_measure: 'pieces', current_stock: 2, reorder_point: 4, reorder_quantity: 6, lead_time_days: 30, unit_cost: 890.00, location: 'Tool Crib A', is_critical: true },
  { part_number: 'JIG-003', description: 'Assembly Jig - Gearbox Housing', category: 'jig', unit_of_measure: 'pieces', current_stock: 8, reorder_point: 5, reorder_quantity: 5, lead_time_days: 60, unit_cost: 2100.00, location: 'Tool Crib B', is_critical: false },
  
  // Fixtures
  { part_number: 'FIX-101', description: 'CNC Fixture - Shaft Machining', category: 'fixture', unit_of_measure: 'pieces', current_stock: 12, reorder_point: 8, reorder_quantity: 10, lead_time_days: 40, unit_cost: 750.00, location: 'CNC Area', is_critical: true },
  { part_number: 'FIX-102', description: 'Milling Fixture - Bracket Production', category: 'fixture', unit_of_measure: 'pieces', current_stock: 3, reorder_point: 6, reorder_quantity: 8, lead_time_days: 35, unit_cost: 520.00, location: 'Milling Area', is_critical: false },
  { part_number: 'FIX-103', description: 'Lathe Fixture - Roller Assembly', category: 'fixture', unit_of_measure: 'pieces', current_stock: 15, reorder_point: 10, reorder_quantity: 12, lead_time_days: 25, unit_cost: 680.00, location: 'Lathe Section', is_critical: false },
  
  // Components
  { part_number: 'COMP-201', description: 'Hardened Steel Pin - 10mm x 50mm', category: 'component', unit_of_measure: 'pieces', current_stock: 450, reorder_point: 500, reorder_quantity: 1000, lead_time_days: 14, unit_cost: 2.50, location: 'Warehouse A-12', is_critical: true },
  { part_number: 'COMP-202', description: 'Precision Bushing - Bronze', category: 'component', unit_of_measure: 'pieces', current_stock: 230, reorder_point: 300, reorder_quantity: 500, lead_time_days: 21, unit_cost: 8.75, location: 'Warehouse A-15', is_critical: true },
  { part_number: 'COMP-203', description: 'Machine Screw M8 x 25mm Grade 8.8', category: 'component', unit_of_measure: 'pieces', current_stock: 1200, reorder_point: 1000, reorder_quantity: 2000, lead_time_days: 7, unit_cost: 0.35, location: 'Fasteners Bay', is_critical: false },
  { part_number: 'COMP-204', description: 'Ball Bearing 6205-2RS', category: 'component', unit_of_measure: 'pieces', current_stock: 85, reorder_point: 120, reorder_quantity: 200, lead_time_days: 28, unit_cost: 12.50, location: 'Warehouse B-08', is_critical: true },
  { part_number: 'COMP-205', description: 'Hydraulic Seal Kit - 50mm', category: 'component', unit_of_measure: 'pieces', current_stock: 18, reorder_point: 25, reorder_quantity: 50, lead_time_days: 42, unit_cost: 45.00, location: 'Warehouse C-03', is_critical: true },
  
  // Raw Materials
  { part_number: 'RAW-301', description: 'Tool Steel Bar - D2 - 50mm diameter', category: 'raw_material', unit_of_measure: 'meters', current_stock: 15.5, reorder_point: 20, reorder_quantity: 50, lead_time_days: 35, unit_cost: 125.00, location: 'Raw Material Storage', is_critical: true },
  { part_number: 'RAW-302', description: 'Aluminum Plate 6061-T6 - 25mm thick', category: 'raw_material', unit_of_measure: 'kg', current_stock: 280, reorder_point: 300, reorder_quantity: 500, lead_time_days: 21, unit_cost: 8.50, location: 'Raw Material Storage', is_critical: false },
  { part_number: 'RAW-303', description: 'Stainless Steel Sheet 304 - 3mm', category: 'raw_material', unit_of_measure: 'kg', current_stock: 150, reorder_point: 200, reorder_quantity: 400, lead_time_days: 28, unit_cost: 12.00, location: 'Raw Material Storage', is_critical: false },
  
  // Cutting Tools
  { part_number: 'TOOL-401', description: 'Carbide End Mill - 12mm 4-Flute', category: 'tool', unit_of_measure: 'pieces', current_stock: 25, reorder_point: 30, reorder_quantity: 50, lead_time_days: 14, unit_cost: 45.00, location: 'Tool Crib C', is_critical: true },
  { part_number: 'TOOL-402', description: 'HSS Drill Bit Set - Metric', category: 'tool', unit_of_measure: 'pieces', current_stock: 8, reorder_point: 12, reorder_quantity: 20, lead_time_days: 10, unit_cost: 125.00, location: 'Tool Crib C', is_critical: false },
  { part_number: 'TOOL-403', description: 'Turning Insert - CNMG 120408', category: 'tool', unit_of_measure: 'pieces', current_stock: 180, reorder_point: 200, reorder_quantity: 500, lead_time_days: 21, unit_cost: 6.50, location: 'Tool Crib D', is_critical: true },
];

// Generate consumption history for the last 6 months
function generateConsumptionHistory(partId: number, avgMonthlyConsumption: number) {
  const records = [];
  const today = new Date();
  
  for (let i = 0; i < 180; i++) { // 6 months of daily data
    const consumptionDate = new Date(today);
    consumptionDate.setDate(consumptionDate.getDate() - i);
    
    // Random variation ±30%
    const dailyConsumption = (avgMonthlyConsumption / 30) * (0.7 + Math.random() * 0.6);
    
    if (dailyConsumption > 0.1) { // Only add if meaningful consumption
      records.push({
        part_id: partId,
        consumed_quantity: Math.round(dailyConsumption * 100) / 100,
        consumption_date: consumptionDate.toISOString().split('T')[0],
        work_order: `WO-${Math.floor(Math.random() * 9000) + 1000}`,
        machine_id: `MACH-${Math.floor(Math.random() * 20) + 1}`,
      });
    }
  }
  
  return records;
}

async function seedDatabase() {
  const client = await pool.connect();
  
  try {
    console.log(' Seeding inventory database...');
    
    // Clear existing data
    await client.query('TRUNCATE TABLE consumption_history, inventory_transactions, parts RESTART IDENTITY CASCADE');
    
    // Insert parts
    console.log('Inserting sample parts...');
    const partIds: number[] = [];
    
    for (const part of sampleParts) {
      const result = await client.query(
        `INSERT INTO parts (
          part_number, description, category, unit_of_measure, 
          current_stock, reorder_point, reorder_quantity, 
          lead_time_days, unit_cost, location, is_critical
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING id`,
        [
          part.part_number, part.description, part.category, part.unit_of_measure,
          part.current_stock, part.reorder_point, part.reorder_quantity,
          part.lead_time_days, part.unit_cost, part.location, part.is_critical
        ]
      );
      partIds.push(result.rows[0].id);
    }
    
    console.log(`Inserted ${sampleParts.length} parts`);
    
    // Generate consumption history
    console.log(' Generating consumption history...');
    let totalConsumptionRecords = 0;
    
    for (let i = 0; i < sampleParts.length; i++) {
      const part = sampleParts[i];
      const partId = partIds[i];
      
      // Estimate monthly consumption based on reorder quantity
      const avgMonthlyConsumption = part.reorder_quantity * 0.8;
      
      const consumptionRecords = generateConsumptionHistory(partId, avgMonthlyConsumption);
      
      for (const record of consumptionRecords) {
        await client.query(
          `INSERT INTO consumption_history (
            part_id, consumed_quantity, consumption_date, work_order, machine_id
          ) VALUES ($1, $2, $3, $4, $5)`,
          [record.part_id, record.consumed_quantity, record.consumption_date, record.work_order, record.machine_id]
        );
        totalConsumptionRecords++;
      }
    }
    
    console.log(`Generated ${totalConsumptionRecords} consumption records`);
    
    // Generate some recent transactions
    console.log(' Creating sample transactions...');
    let transactionCount = 0;
    
    for (let i = 0; i < partIds.length; i++) {
      const partId = partIds[i];
      const currentStock = sampleParts[i].current_stock;
      
      // Create a receipt transaction
      await client.query(
        `INSERT INTO inventory_transactions (
          part_id, transaction_type, quantity, balance_after, reference_number, notes
        ) VALUES ($1, $2, $3, $4, $5, $6)`,
        [partId, 'receipt', currentStock, currentStock, `PO-${1000 + i}`, 'Initial stock']
      );
      transactionCount++;
    }
    
    console.log(` Created ${transactionCount} transactions`);
    
    // Show summary
    const stockSummary = await client.query(`
      SELECT 
        category,
        COUNT(*) as part_count,
        SUM(CASE WHEN current_stock <= reorder_point THEN 1 ELSE 0 END) as low_stock_count
      FROM parts
      GROUP BY category
      ORDER BY category
    `);
    
    console.log('\nStock Summary:');
    console.table(stockSummary.rows);
    
    const lowStockParts = await client.query(`
      SELECT part_number, description, current_stock, reorder_point
      FROM parts
      WHERE current_stock <= reorder_point
      ORDER BY (current_stock / NULLIF(reorder_point, 0))
      LIMIT 5
    `);
    
    console.log('\n Top 5 Low Stock Items:');
    console.table(lowStockParts.rows);
    
    console.log('\nDatabase seeding completed successfully!');
    
  } catch (error) {
    console.error(' Seeding failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

seedDatabase();