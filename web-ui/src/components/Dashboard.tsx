import './Dashboard.css';

function Dashboard() {
  return (
    <div className="dashboard">
      <h2>📊 Inventory Dashboard</h2>
      
      <div className="dashboard-grid">
        <div className="dashboard-card">
          <h3>📦 Total Parts</h3>
          <p className="big-number">16</p>
          <p className="subtitle">Active SKUs</p>
        </div>

        <div className="dashboard-card">
          <h3>⚠️ Low Stock</h3>
          <p className="big-number warning">5</p>
          <p className="subtitle">Below Reorder Point</p>
        </div>

        <div className="dashboard-card">
          <h3>🚨 Critical</h3>
          <p className="big-number critical">2</p>
          <p className="subtitle">Immediate Attention</p>
        </div>

        <div className="dashboard-card">
          <h3>✅ Adequate</h3>
          <p className="big-number success">11</p>
          <p className="subtitle">Healthy Stock Levels</p>
        </div>
      </div>

      <div className="info-section">
        <h3>ℹ️ Quick Stats</h3>
        <ul>
          <li><strong>Categories:</strong> Jigs, Fixtures, Components, Raw Materials, Tools</li>
          <li><strong>Monitoring:</strong> Real-time stock levels and consumption trends</li>
          <li><strong>Alerts:</strong> Autonomous monitoring every 15 minutes</li>
          <li><strong>AI Agent:</strong> Natural language inventory queries</li>
        </ul>
      </div>

      <div className="info-section">
        <p className="note">
          💡 <strong>Tip:</strong> Use the Chat tab to ask questions about specific parts or trends. 
          The AI agent can analyze consumption patterns and predict stockouts.
        </p>
      </div>
    </div>
  );
}

export default Dashboard;