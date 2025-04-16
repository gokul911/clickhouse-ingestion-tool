// src/components/ConnectClickHouse.jsx
import React, { useState } from 'react';
import "../styles/ConnectClickHouse.css";
import ProgressBar from './ProgressBar';

export default function ConnectClickHouse({ setConnectionInfo }) {
  const [localConnection, setLocalConnection] = useState({
    host: 'localhost',
    port: 8123,
    database: 'default',
    user: 'default',
    jwtToken: ''
  });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setLocalConnection({ ...localConnection, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const minLoadingTime = new Promise(resolve => setTimeout(resolve, 800));  // Minimum 800ms
    try {
      // const response = await fetch(`${import.meta.env.VITE_API_URL}/api/connect-clickhouse`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(localConnection)
      // });
      const responsePromise = fetch(`${import.meta.env.VITE_API_URL}/api/connect-clickhouse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(localConnection)
      });
  
      const [response] = await Promise.all([responsePromise, minLoadingTime]);
      
      const text = await response.text();
      console.log(response);
      console.log(text);
      if (response.ok) {
        setMessage('CONNECTED');
        setConnectionInfo(localConnection);
        sessionStorage.setItem('clickhouseConnection', JSON.stringify(localConnection));
      } else {
        setMessage(text);
      }
    } catch (err) {
      setMessage('Connection error!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="connect-container">
      <ProgressBar visible={loading}/>
      <h2>Connect to ClickHouse</h2>
      <form onSubmit={handleSubmit}>
        <input type="text" name="host" placeholder="Host" value={localConnection.host} onChange={handleChange} />
        <input type="number" name="port" placeholder="Port" value={localConnection.port} onChange={handleChange} />
        <input type="text" name="database" placeholder="Database" value={localConnection.database} onChange={handleChange} />
        <input type="text" name="user" placeholder="User" value={localConnection.user} onChange={handleChange} />
        <input type="password" name="jwtToken" placeholder="JWT Token" value={localConnection.jwtToken} onChange={handleChange} />
        <button type="submit">Connect</button>
      </form>
      {message && (
        <p className={message === "CONNECTED" ? "success" : "error"}>
          {message}
        </p>
      )}
    </div>
  );
}
