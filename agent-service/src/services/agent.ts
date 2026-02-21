import Anthropic from '@anthropic-ai/sdk';
import { getMCPClient, getMCPTools, callMCPTool } from '../mcp/client.js';
import { memoryService } from './memory.js';
import dotenv from 'dotenv';

dotenv.config();

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const MODEL = 'claude-sonnet-4-20250514';

export class AgentService {
  /**
   * Process a chat message with Claude
   */
  async processMessage(sessionId: string, userMessage: string, userId?: string): Promise<string> {
    try {
      // Get or create conversation
      const conversation = await memoryService.getOrCreateConversation(sessionId, userId);
      
      // Store user message
      await memoryService.storeMessage(conversation.id, 'user', userMessage);
      
      // Get conversation history
      const conversationHistory = await memoryService.buildClaudeContext(conversation.id, 10);
      
      // Get MCP tools
      const mcpTools = await getMCPTools();
      
      // Convert MCP tools to Claude tool format
      const claudeTools = mcpTools.map(tool => ({
        name: tool.name,
        description: tool.description,
        input_schema: tool.inputSchema
      }));
      
      // System prompt
      const systemPrompt = `You are Vertex, an AI assistant for supply chain and inventory management in a mechanical manufacturing facility.

You have access to a real-time inventory management system through MCP tools. You can:
- Check current stock levels for parts (jigs, fixtures, components, raw materials, tools)
- Search for parts by description or part number
- Get detailed information about specific parts
- Identify low stock items that need attention
- Analyze consumption trends and predict stockouts
- Update reorder points when needed

When users ask about inventory:
1. Use the appropriate MCP tools to get accurate, real-time data
2. Provide clear, actionable insights
3. Flag critical issues (out of stock, critically low items)
4. Suggest reorders when stock is below reorder point
5. Use consumption trends to make informed recommendations

Be professional, concise, and focus on helping operations teams make informed decisions about their inventory.

Current date: ${new Date().toISOString().split('T')[0]}`;

      // Create messages array with history
      const messages = [
        ...conversationHistory,
        { role: 'user' as const, content: userMessage }
      ];
      
      // Call Claude with tools
      let response = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 4096,
        system: systemPrompt,
        messages: messages,
        tools: claudeTools,
      });
      
      // Handle tool use (agentic loop)
      while (response.stop_reason === 'tool_use') {
        const toolUseBlocks = response.content.filter(
          (block): block is Anthropic.Messages.ToolUseBlock => block.type === 'tool_use'
        );
        
        const toolResults: Anthropic.Messages.ToolResultBlockParam[] = [];
        
        // Execute each tool call
        for (const toolUse of toolUseBlocks) {
          console.log(`🔧 Calling tool: ${toolUse.name}`);
          console.log(`   Args:`, JSON.stringify(toolUse.input, null, 2));
          
          try {
            const result = await callMCPTool(toolUse.name, toolUse.input);
                        
                        // Extract text content from MCP response
                        const content = result.content as Array<{ type: string; text?: string }>;
                        const textContent = content
                        .filter((c) => c.type === 'text')
                        .map((c) => c.text || '')
                        .join('\n');
            console.log(`   📊 Tool returned:`, textContent.substring(0, 200)); // ADD THIS LINE
            toolResults.push({
              type: 'tool_result',
              tool_use_id: toolUse.id,
              content: textContent,
            });
            
            console.log(`   ✅ Tool result received`);
          } catch (error: any) {
            console.error(`   ❌ Tool error:`, error.message);
            toolResults.push({
              type: 'tool_result',
              tool_use_id: toolUse.id,
              content: `Error: ${error.message}`,
              is_error: true,
            });
          }
        }
        
        // Continue conversation with tool results
        messages.push({
          role: 'assistant',
          content: response.content,
        });
        
        messages.push({
          role: 'user',
          content: toolResults,
        });
        
        // Get next response from Claude
        response = await anthropic.messages.create({
          model: MODEL,
          max_tokens: 4096,
          system: systemPrompt,
          messages: messages,
          tools: claudeTools,
        });
      }
      
      // Extract final text response
      const finalResponse = response.content
        .filter((block): block is Anthropic.Messages.TextBlock => block.type === 'text')
        .map(block => block.text)
        .join('\n');
      
      // Store assistant response
      await memoryService.storeMessage(
        conversation.id,
        'assistant',
        finalResponse,
        response.content.filter(block => block.type === 'tool_use')
      );
      
      return finalResponse;
      
    } catch (error: any) {
      console.error('❌ Agent error:', error);
      throw new Error(`Agent processing failed: ${error.message}`);
    }
  }
}

export const agentService = new AgentService();