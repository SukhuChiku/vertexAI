# vertexAI - Supply Chain Risk Agent

An intelligent inventory management system using Claude AI and Model Context Protocol (MCP) to automate supply chain monitoring for mechanical manufacturing.

## Features

- 🤖 **AI-Powered Chat Interface** - Natural language queries for inventory data
- 📊 **Real-Time Monitoring** - Autonomous alerts for low stock items
- 💬 **Persistent Memory** - Context-aware conversations across sessions
- ⚡ **MCP Integration** - Secure tool-based access to databases and APIs

## Tech Stack

- **Backend**: Node.js, TypeScript, Express
- **Frontend**: React, Vite
- **Database**: PostgreSQL
- **AI**: Claude API (Anthropic), Model Context Protocol
- **Infrastructure**: Docker

## Architecture
```
┌─────────────────┐
│    Web UI       │  React + Vite
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Agent Service  │  Express + Claude API
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  MCP Server     │  Inventory Tools
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   PostgreSQL    │  Inventory + Agent DBs
└─────────────────┘
```

## Prerequisites

- Node.js 18+ 
- Docker & Docker Compose
- Anthropic API Key ([Get one here](https://console.anthropic.com/))

## Installation

### 1. Clone the repository
```bash
git clone https://github.com/SukhuChiku/vertexAI
cd vertex
```

### 2. Install dependencies
```bash
# Install dependencies for all services
cd mcp-server && npm install
cd ../agent-service && npm install
cd ../web-ui && npm install
cd ..
```

### 3. Set up environment variables
```bash
# Copy example env files
cp mcp-server/.env.example mcp-server/.env
cp agent-service/.env.example agent-service/.env
cp web-ui/.env.example web-ui/.env

# Edit the .env files and add your credentials
# IMPORTANT: Add your Anthropic API key in agent-service/.env
```

**Required environment variables:**

- `ANTHROPIC_API_KEY` - Get from [Anthropic Console](https://console.anthropic.com/)
- `DB_PASSWORD` - PostgreSQL password (default: `your_vertex_password`)

### 4. Start PostgreSQL
```bash
docker-compose up -d
```

Wait 10 seconds for PostgreSQL to initialize.

### 5. Run database migrations
```bash
# Inventory database
cd mcp-server
npm run migrate
npm run seed

# Agent database
cd ../agent-service
npm run migrate
```

### 6. Start the services

Open 3 terminal windows:

**Terminal 1 - Agent Service:**
```bash
cd agent-service
npm run dev
```

**Terminal 2 - Web UI:**
```bash
cd web-ui
npm run dev
```

**Terminal 3 - Verify everything is running:**
```bash
# Check database
docker exec -it vertex-postgres psql -U vertex -d vertex_inventory -c "SELECT COUNT(*) FROM parts;"

# Should show: 16 parts
```

### 7. Access the application

Open your browser to: **http://localhost:3000**

Try asking:
- "What parts are currently low on stock?"
- "Tell me about part JIG-001"
- "Show me all steel components"

## Project Structure
```
vertex/
├── mcp-server/          # MCP Server for inventory tools
│   ├── src/
│   │   ├── tools/       # MCP tool implementations
│   │   ├── db/          # Database client and migrations
│   │   └── index.ts     # MCP server entry point
│   └── package.json
│
├── agent-service/       # Main AI agent backend
│   ├── src/
│   │   ├── routes/      # Express routes (chat, alerts)
│   │   ├── services/    # Agent orchestration, memory
│   │   ├── mcp/         # MCP client
│   │   └── index.ts     # Express server
│   └── package.json
│
├── web-ui/              # React frontend
│   ├── src/
│   │   ├── components/  # Chat, Alerts, Dashboard
│   │   ├── api/         # API client
│   │   └── App.tsx      # Main app component
│   └── package.json
│
└── docker-compose.yml   # PostgreSQL setup
```

## Available MCP Tools

The system includes 6 inventory management tools:

1. **get_inventory_levels** - Get current stock levels
2. **get_part_details** - Get detailed part information
3. **search_parts** - Search parts by description or number
4. **get_low_stock_items** - Find parts below reorder point
5. **get_consumption_history** - Analyze usage trends
6. **update_reorder_point** - Modify reorder thresholds

## Development

### Build for production
```bash
# Build MCP server
cd mcp-server && npm run build

# Build agent service
cd ../agent-service && npm run build

# Build web UI
cd ../web-ui && npm run build
```

### Database management
```bash
# View tables
docker exec -it vertex-postgres psql -U vertex -d vertex_inventory -c "\dt"

# Reset database
docker-compose down -v
docker-compose up -d
cd mcp-server && npm run migrate && npm run seed
```

## Troubleshooting

### Port 5432 already in use

If you have another PostgreSQL running:
```bash
# Check what's using port 5432
lsof -i :5432

# Stop local PostgreSQL (if using Homebrew)
brew services stop postgresql

# Or kill the process
kill <PID>
```

### MCP tools not working
```bash
# Verify MCP server can connect to database
cd mcp-server
npx tsx test-tools.ts
```

### Agent service fails to start

Check that:
1. PostgreSQL is running: `docker ps | grep postgres`
2. `.env` file exists in `agent-service/`
3. `ANTHROPIC_API_KEY` is set correctly
4. No other service is using port 4000

## Security Note

⚠️ **For Production Use:**

The default database password (`your_vertex_password`) is suitable for local development only. 

For production deployments:
1. Change the database password in PostgreSQL
2. Set `DB_PASSWORD` in your `.env` file
3. Never expose PostgreSQL port 5432 to the internet
4. Use strong, unique passwords

## Future Enhancements

- [ ] Add Vendor MCP Server for supplier management
- [ ] Implement RAG for historical pattern analysis
- [ ] Add multi-agent orchestration (LangGraph/CrewAI)
- [ ] Email/Slack notifications for critical alerts
- [ ] Purchase order generation and approval workflow
- [ ] AWS Bedrock integration for multi-model support

## Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

## License

MIT

