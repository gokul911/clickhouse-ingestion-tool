// src/components/ConnectClickHouse.jsx
import React, { useEffect, useState } from 'react';
import "../styles/ConnectClickHouse.css";
import ProgressBar from './ProgressBar';

export default function ConnectClickHouse({ setConnectionInfo }) {
  const [localConnection, setLocalConnection] = useState({
    host: import.meta.env.VITE_CLICKHOUSE_HOST,
    port: import.meta.env.VITE_CLICKHOUSE_PORT,
    database: import.meta.env.VITE_CLICKHOUSE_DATABASE,
    user: import.meta.env.VITE_CLICKHOUSE_USER,
    jwtToken: ''
  });
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const isConnected = sessionStorage.getItem('isConnected') === 'true';
    const savedConnection = sessionStorage.getItem('clickhouseConnection');
    if (isConnected && savedConnection) {
      setMessage('CONNECTED');
      setConnectionInfo(JSON.parse(savedConnection));
    }
  }, []);

  const handleChange = (e) => {
    setLocalConnection({ ...localConnection, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    // const minLoadingTime = new Promise(resolve => setTimeout(resolve, 800));  // Minimum 800ms
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/connect-clickhouse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(localConnection)
      });
  
      // const [response] = await Promise.all([responsePromise, minLoadingTime]);
      
      const text = await response.text();
      console.log(response);
      console.log(text);
      if (response.ok) {
        setMessage('CONNECTED');
        setConnectionInfo(localConnection);
        sessionStorage.setItem('clickhouseConnection', JSON.stringify(localConnection));
        sessionStorage.setItem('isConnected', 'true');
      } else {
        setMessage(text);
      }
    } catch (err) {
      console.log(err);
      setMessage('FAILED TO CONNECT');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = () => {
    sessionStorage.removeItem('clickhouseConnection');
    sessionStorage.setItem('isConnected', 'false');
    setMessage('');
    setLocalConnection({
      host: import.meta.env.VITE_CLICKHOUSE_HOST,
      port: import.meta.env.VITE_CLICKHOUSE_PORT,
      database: import.meta.env.VITE_CLICKHOUSE_DATABASE,
      user: import.meta.env.VITE_CLICKHOUSE_USER,
      jwtToken: ''
    });
    setConnectionInfo(null);
  };  

  return (
    <div className="connect-container">
      <ProgressBar visible={isLoading}/>
      <h2>Connect to ClickHouse</h2>
      <form onSubmit={handleSubmit}>
        <input type="text" name="host" placeholder="Host" value={localConnection.host} onChange={handleChange} />
        <input type="number" name="port" placeholder="Port" value={localConnection.port} onChange={handleChange} />
        <input type="text" name="database" placeholder="Database" value={localConnection.database} onChange={handleChange} />
        <input type="text" name="user" placeholder="User" value={localConnection.user} onChange={handleChange} />
        <input type="password" name="jwtToken" disabled={message === "CONNECTED"} placeholder="JWT Token" value={localConnection.jwtToken} onChange={handleChange} />
        {message === "CONNECTED" ? (
          <button type="button" onClick={handleDisconnect}>Disconnect</button>
        ) : (
          <button type="submit">Connect</button>
        )}

      </form>
      {message && (
        <p className={message === "CONNECTED" ? "success" : "error"}>
          {message}
        </p>
      )}
    </div>
  );
}
