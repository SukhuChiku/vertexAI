import { useState } from 'react';
import ChatWindow from './components/ChatWindow';
import AlertPanel from './components/AlertPanel';
import Dashboard from './components/Dashboard';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState<'chat' | 'alerts' | 'dashboard'>('chat');

  return (
    <div className="app">
      <header className="app-header">
        <h1> Vertex</h1>
        <p className="subtitle">Supply Chain Risk Agent</p>
      </header>

      <nav className="app-nav">
        <button
          className={activeTab === 'chat' ? 'active' : ''}
          onClick={() => setActiveTab('chat')}
        >
          💬 Chat
        </button>
        <button
          className={activeTab === 'alerts' ? 'active' : ''}
          onClick={() => setActiveTab('alerts')}
        >
          🚨 Alerts
        </button>
        {/* <button
          className={activeTab === 'dashboard' ? 'active' : ''}
          onClick={() => setActiveTab('dashboard')}
        >
          📊 Dashboard
        </button> */}
      </nav>

      <main className="app-main">
        {activeTab === 'chat' && <ChatWindow />}
        {activeTab === 'alerts' && <AlertPanel />}
        {/* {activeTab === 'dashboard' && <Dashboard />} */}
      </main>
    </div>
  );
}

export default App;