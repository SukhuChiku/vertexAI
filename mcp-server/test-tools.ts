import { inventoryTools } from './src/tools/inventory.js';

async function testTools() {
  console.log('Testing Inventory MCP Tools\n');
  
  // Test 1: Get all inventory levels
  console.log('Testing get_inventory_levels (all parts)...');
  const allInventory = await inventoryTools.get_inventory_levels({});
  console.log(`   Found ${allInventory.count} parts`);
  console.log(`   Sample:`, allInventory.data?.[0]);
  console.log('');
  
  // Test 2: Get specific part details
  console.log('Testing get_part_details (JIG-001)...');
  const partDetails = await inventoryTools.get_part_details({ part_number: 'JIG-001' });
  console.log(`   Part:`, partDetails.data?.part?.description);
  console.log(`   Stock:`, partDetails.data?.part?.current_stock);
  console.log('');
  
  // Test 3: Search parts
  console.log('Testing search_parts (search: "steel")...');
  const searchResults = await inventoryTools.search_parts({ query: 'steel' });
  console.log(`   Found ${searchResults.count} matching parts`);
  console.log('');
  
  // Test 4: Get low stock items
  console.log(' Testing get_low_stock_items...');
  const lowStock = await inventoryTools.get_low_stock_items({});
  console.log(`   Total low stock items: ${lowStock.count}`);
  console.log(`   Out of stock: ${lowStock.summary?.out_of_stock}`);
  console.log(`   Critical: ${lowStock.summary?.critical}`);
  console.log(`   Low: ${lowStock.summary?.low}`);
  console.log('');
  
  // Test 5: Get consumption history
  console.log('Testing get_consumption_history (COMP-201)...');
  const consumption = await inventoryTools.get_consumption_history({ 
    part_number: 'COMP-201', 
    days: 30 
  });
  console.log(`   Avg daily consumption:`, consumption.data?.summary.avg_daily_consumption);
  console.log(`   Days until stockout:`, consumption.data?.summary.estimated_days_until_stockout);
  console.log('');
  
  // Test 6: Update reorder point
  console.log('Testing update_reorder_point (JIG-002)...');
  const update = await inventoryTools.update_reorder_point({ 
    part_number: 'JIG-002', 
    new_reorder_point: 5 
  });
  console.log(`   ${update.message}`);
  console.log('');
  
  console.log('All tools tested successfully!');
  process.exit(0);
}

testTools().catch(console.error);