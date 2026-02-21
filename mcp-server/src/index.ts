#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { inventoryTools } from './tools/inventory.js';
import pool from './db/client.js';

// Define tool schemas
const TOOL_SCHEMAS = [
  {
    name: 'get_inventory_levels',
    description: 'Get current inventory levels for all parts or a specific part. Returns stock quantities, reorder points, and stock status.',
    inputSchema: {
      type: 'object',
      properties: {
        part_number: {
          type: 'string',
          description: 'Optional: specific part number to query. If not provided, returns all parts.'
        }
      }
    }
  },
  {
    name: 'get_part_details',
    description: 'Get detailed information about a specific part including specifications, stock levels, location, and recent transaction history.',
    inputSchema: {
      type: 'object',
      properties: {
        part_number: {
          type: 'string',
          description: 'The part number to look up (e.g., JIG-001, COMP-201)'
        }
      },
      required: ['part_number']
    }
  },
  {
    name: 'search_parts',
    description: 'Search for parts by description or part number. Supports partial matching and category filtering.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search term to match against part number or description'
        },
        category: {
          type: 'string',
          description: 'Optional: filter by category (jig, fixture, component, raw_material, tool)',
          enum: ['jig', 'fixture', 'component', 'raw_material', 'tool']
        }
      },
      required: ['query']
    }
  },
  {
    name: 'get_low_stock_items',
    description: 'Get all parts with stock levels at or below their reorder points. Returns items grouped by severity (out of stock, critical, low).',
    inputSchema: {
      type: 'object',
      properties: {
        threshold_percentage: {
          type: 'number',
          description: 'Optional: percentage threshold (default 100 = at reorder point, 50 = half of reorder point). Returns parts at or below this percentage.',
          default: 100
        }
      }
    }
  },
  {
    name: 'get_consumption_history',
    description: 'Get consumption history and usage trends for a specific part. Calculates daily/weekly/monthly averages and estimates time until stockout.',
    inputSchema: {
      type: 'object',
      properties: {
        part_number: {
          type: 'string',
          description: 'The part number to analyze'
        },
        days: {
          type: 'number',
          description: 'Number of days of history to analyze (default: 90)',
          default: 90
        }
      },
      required: ['part_number']
    }
  },
  {
    name: 'update_reorder_point',
    description: 'Update the reorder point threshold for a specific part. Used to adjust when the system alerts for low stock.',
    inputSchema: {
      type: 'object',
      properties: {
        part_number: {
          type: 'string',
          description: 'The part number to update'
        },
        new_reorder_point: {
          type: 'number',
          description: 'The new reorder point value (must be positive)'
        }
      },
      required: ['part_number', 'new_reorder_point']
    }
  }
];

// Create MCP server
const server = new Server(
  {
    name: 'vertex-inventory-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Handle list_tools request
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: TOOL_SCHEMAS
  };
});

// Handle call_tool request
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    // Route to appropriate tool handler
    switch (name) {
      case 'get_inventory_levels':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await inventoryTools.get_inventory_levels(args || {}), null, 2)
            }
          ]
        };

      case 'get_part_details':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await inventoryTools.get_part_details(args as any), null, 2)
            }
          ]
        };

      case 'search_parts':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await inventoryTools.search_parts(args as any), null, 2)
            }
          ]
        };

      case 'get_low_stock_items':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await inventoryTools.get_low_stock_items(args || {}), null, 2)
            }
          ]
        };

      case 'get_consumption_history':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await inventoryTools.get_consumption_history(args as any), null, 2)
            }
          ]
        };

      case 'update_reorder_point':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(await inventoryTools.update_reorder_point(args as any), null, 2)
            }
          ]
        };

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error: any) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ success: false, error: error.message }, null, 2)
        }
      ],
      isError: true
    };
  }
});

// Start the server
async function main() {
  console.error(' Vertex Inventory MCP Server starting...');
  
  // Test database connection
  try {
    await pool.query('SELECT NOW()');
    console.error(' Database connection verified');
  } catch (error) {
    console.error(' Database connection failed:', error);
    process.exit(1);
  }
  
  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  console.error('Vertex Inventory MCP Server running');
  console.error('Available tools:', TOOL_SCHEMAS.length);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});