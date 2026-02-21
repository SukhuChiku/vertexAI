import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let mcpClient: Client | null = null;
let mcpTransport: StdioClientTransport | null = null;

export async function initializeMCPClient() {
  if (mcpClient) {
    return mcpClient;
  }

  try {
    console.log('Initializing MCP client...');

    // Path to the MCP server
    const mcpServerPath = path.resolve(__dirname, '../../../mcp-server/dist/index.js');
    console.log('MCP Server path:', mcpServerPath);

    // Spawn the MCP server process
    const serverProcess = spawn('node', [mcpServerPath], {
      stdio: ['pipe', 'pipe', 'inherit'], // stdin, stdout, stderr
    });

    // Create transport
    mcpTransport = new StdioClientTransport({
      command: 'node',
      args: [mcpServerPath],
    });

    // Create client
    mcpClient = new Client(
      {
        name: 'vertex-agent-client',
        version: '1.0.0',
      },
      {
        capabilities: {},
      }
    );

    // Connect to the MCP server
    await mcpClient.connect(mcpTransport);

    console.log('✅ MCP client connected');

    // List available tools
    const toolsResponse = await mcpClient.listTools();
    console.log(`Available MCP tools: ${toolsResponse.tools.length}`);
    toolsResponse.tools.forEach(tool => {
      console.log(`   - ${tool.name}`);
    });

    return mcpClient;
  } catch (error) {
    console.error('Failed to initialize MCP client:', error);
    throw error;
  }
}

export async function getMCPClient(): Promise<Client> {
  if (!mcpClient) {
    return await initializeMCPClient();
  }
  return mcpClient;
}

export async function closeMCPClient() {
  if (mcpClient && mcpTransport) {
    await mcpClient.close();
    mcpClient = null;
    mcpTransport = null;
    console.log(' MCP client disconnected');
  }
}

// Get available tools from MCP server
export async function getMCPTools() {
  const client = await getMCPClient();
  const response = await client.listTools();
  return response.tools;
}

// Call an MCP tool
export async function callMCPTool(toolName: string, args: any) {
  const client = await getMCPClient();
  const response = await client.callTool({
    name: toolName,
    arguments: args,
  });
  return response;
}