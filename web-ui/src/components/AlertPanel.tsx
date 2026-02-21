import { useState, useEffect } from 'react';
import { api, Alert } from '../api/client';
import './AlertPanel.css';

function AlertPanel() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      const data = await api.getAlerts();
      setAlerts(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
    const interval = setInterval(loadAlerts, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const handleAcknowledge = async (alertId: number) => {
    try {
      await api.acknowledgeAlert(alertId);
      await loadAlerts();
    } catch (err: any) {
      alert(`Failed to acknowledge alert: ${err.message}`);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return '#dc2626';
      case 'high': return '#ea580c';
      case 'medium': return '#f59e0b';
      case 'low': return '#3b82f6';
      default: return '#6b7280';
    }
  };

  if (loading) {
    return <div className="alert-panel"><p>Loading alerts...</p></div>;
  }

  if (error) {
    return (
      <div className="alert-panel">
        <p className="error">Error: {error}</p>
        <p className="note">Note: Alerts feature requires the autonomous monitoring service to be running.</p>
      </div>
    );
  }

  const activeAlerts = alerts.filter(a => !a.acknowledged);
  const acknowledgedAlerts = alerts.filter(a => a.acknowledged);

  return (
    <div className="alert-panel">
      <div className="alert-header">
        <h2>🚨 Active Alerts ({activeAlerts.length})</h2>
        <button onClick={loadAlerts} className="refresh-btn">🔄 Refresh</button>
      </div>

      {activeAlerts.length === 0 ? (
        <div className="no-alerts">
          <p>✅ No active alerts</p>
          <p className="note">All inventory levels are adequate</p>
        </div>
      ) : (
        <div className="alerts-list">
          {activeAlerts.map((alert) => (
            <div
              key={alert.id}
              className="alert-card"
              style={{ borderLeft: `4px solid ${getSeverityColor(alert.severity)}` }}
            >
              <div className="alert-card-header">
                <span className="severity-badge" style={{ backgroundColor: getSeverityColor(alert.severity) }}>
                  {alert.severity.toUpperCase()}
                </span>
                <span className="alert-type">{alert.alert_type}</span>
              </div>

              <div className="alert-card-body">
                <h3>{alert.part_number}</h3>
                {alert.part_description && <p className="description">{alert.part_description}</p>}
                
                <div className="alert-stats">
                  {alert.current_stock !== undefined && (
                    <div className="stat">
                      <span className="label">Current Stock:</span>
                      <span className="value">{alert.current_stock}</span>
                    </div>
                  )}
                  {alert.reorder_point !== undefined && (
                    <div className="stat">
                      <span className="label">Reorder Point:</span>
                      <span className="value">{alert.reorder_point}</span>
                    </div>
                  )}
                  {alert.stock_percentage !== undefined && (
                    <div className="stat">
                      <span className="label">Stock Level:</span>
                      <span className="value">{alert.stock_percentage.toFixed(1)}%</span>
                    </div>
                  )}
                </div>

                <p className="alert-message">{alert.message}</p>

                {alert.recommendation && (
                  <div className="recommendation">
                    <strong>💡 Recommendation:</strong>
                    <p>{alert.recommendation}</p>
                  </div>
                )}
              </div>

              <div className="alert-card-footer">
                <span className="timestamp">{new Date(alert.created_at).toLocaleString()}</span>
                <button onClick={() => handleAcknowledge(alert.id)} className="acknowledge-btn">
                  ✓ Acknowledge
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {acknowledgedAlerts.length > 0 && (
        <details className="acknowledged-section">
          <summary>Acknowledged Alerts ({acknowledgedAlerts.length})</summary>
          <div className="alerts-list">
            {acknowledgedAlerts.map((alert) => (
              <div key={alert.id} className="alert-card acknowledged">
                <div className="alert-card-header">
                  <span className="severity-badge">{alert.severity}</span>
                  <span className="alert-type">{alert.alert_type}</span>
                </div>
                <div className="alert-card-body">
                  <h3>{alert.part_number}</h3>
                  <p className="alert-message">{alert.message}</p>
                </div>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}

export default AlertPanel;