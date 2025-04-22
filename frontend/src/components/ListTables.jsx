// src/components/ListTables.jsx
import React, { useState } from 'react';
import "../styles/ListTables.css";
import ProgressBar from './ProgressBar';

export default function ListTables({ connection }) {
  const [tables, setTables] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const fetchTables = async () => {
    if (!connection) {
      setError('No connection info provided. Please connect first.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/list-tables`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(connection)
      });
      if (response.ok) {
        const data = await response.json();
        setTables(data);
        setError('');
      } else {
        setError('Failed to fetch tables');
      }
    } catch (err) {
      setError('Error: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="list-tables-container">
      <ProgressBar visible={isLoading}/>
      <h2>List Tables</h2>

      {connection ? (
        <>
          <h4>Connection Details:</h4>
          <div className="connection-details">
            <p><strong>Host:</strong> {connection.host}</p>
            <p><strong>Port:</strong> {connection.port}</p>
            <p><strong>Database:</strong> {connection.database}</p>
            <p><strong>User:</strong> {connection.user}</p>
          </div>
        </>
      ) : (
        <p className="error">No connection details. Please connect first.</p>
      )}

      <button onClick={fetchTables} disabled={!connection}>Fetch Tables</button>

      {error && <p className="error">{error}</p>}

      {tables.length > 0 && (
        <ul>
          {tables.map((table, index) => (
            <li key={index}>{table}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
