// src/App.jsx
import React, { useState } from 'react';
import ConnectClickHouse from './components/ConnectClickHouse';
import ListTables from './components/ListTables';
import Ingest from './components/Ingest';
import JoinTables from './components/JoinTables';
import "./App.css";

export default function App() {
  const [connectionInfo, setConnectionInfo] = useState(() => {
    const saved = sessionStorage.getItem('clickhouseConnection');
    return saved ? JSON.parse(saved) : null;
  });
  const [activeTab, setActiveTab] = useState('connect');

  const renderTab = () => {
    switch (activeTab) {
      case 'connect':
        return <ConnectClickHouse setConnectionInfo={setConnectionInfo} />;
      case 'tables':
        return <ListTables connection={connectionInfo} />;
      case 'ingest':
        return <Ingest connection={connectionInfo} />;
      case 'join':
        return <JoinTables connection={connectionInfo} />;
      default:
        return <div>Select a tab</div>;
    }
  };

  return (
    <div className="app-container">
      <h1>ClickHouse Ingestion Tool</h1>
      <nav>
        <button onClick={() => setActiveTab('connect')}>Connect</button>
        <button onClick={() => setActiveTab('tables')}>List Tables</button>
        <button onClick={() => setActiveTab('ingest')}>Start Ingestion</button>
        <button onClick={() => setActiveTab('join')}>Join Tables</button>
      </nav>
      <div className="tab-content">{renderTab()}</div>
    </div>
  );
}
