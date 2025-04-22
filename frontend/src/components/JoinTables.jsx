// src/components/JoinTables.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import "../styles/JoinTables.css";
import ProgressBar from './ProgressBar';

export default function JoinTables({ connection }) {
  const [availableTables, setAvailableTables] = useState([]);
  const [selectedTables, setSelectedTables] = useState([{ table: '', columns: [], joinColumn: '' }]);
  const [joinCondition, setJoinCondition] = useState('');
  const [resultColumns, setResultColumns] = useState('');
  const [joinType, setJoinType] = useState('INNER JOIN');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!connection) return;
    axios.post(`${import.meta.env.VITE_API_URL}/api/list-tables`, connection)
      .then(res => setAvailableTables(res.data))
      .catch(() => setError('Failed to load tables'));
  }, [connection]);

  const handleTableChange = (index, table) => {
    const updated = [...selectedTables];
    updated[index].table = table;
    updated[index].joinColumn = '';

    axios.post(`${import.meta.env.VITE_API_URL}/api/fetch-columns`, { ...connection, table })
      .then(res => {
        updated[index].columns = res.data;
        setSelectedTables(updated);
      })
      .catch(() => {
        updated[index].columns = [];
        setError(`Failed to load columns for table ${table}`);
        setSelectedTables(updated);
      });
  };

  const handleJoinColumnChange = (index, joinColumn) => {
    const updated = [...selectedTables];
    updated[index].joinColumn = joinColumn;
    setSelectedTables(updated);
  };

  const addTable = () => {
    setSelectedTables([...selectedTables, { table: '', columns: [], joinColumn: '' }]);
  };

  const removeTable = (index) => {
    const updated = selectedTables.filter((_, i) => i !== index);
    setSelectedTables(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedTables.length < 2) {
      setError('Select at least two tables for a join.');
      return;
    }
    const tables = selectedTables.map(item => item.table);
    const condition = joinCondition || selectedTables
      .slice(1)
      .map((_, i) => `${selectedTables[i].table}.${selectedTables[i].joinColumn} = ${selectedTables[i + 1].table}.${selectedTables[i + 1].joinColumn}`)
      .join(' AND ');

    const payload = {
      connection,
      tables,
      joinCondition: condition,
      selectedColumns: resultColumns ? resultColumns.split(',').map(col => col.trim()) : [],
      joinType
    };

    setIsLoading(true);
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/join`, payload);
      
      sessionStorage.setItem('previewData', JSON.stringify(response.data));
      sessionStorage.setItem('previewError', '');
      navigate('/preview');
    
    } catch (err) {
      sessionStorage.setItem('previewData', JSON.stringify([]));
      sessionStorage.setItem('previewError', err.response?.data?.error || err.message);
      setError(err.response?.data?.error || err.message);
      navigate('/preview');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="join-tables-container">
      <ProgressBar visible={isLoading}/>
      <h2 className="join-tables-title">Multi-Table Join</h2>

      <h4>Connection Details:</h4>
      {connection ? (
        
          <div className="connection-details">
            <p><strong>Host:</strong> {connection.host}</p>
            <p><strong>Port:</strong> {connection.port}</p>
            <p><strong>Database:</strong> {connection.database}</p>
            <p><strong>User:</strong> {connection.user}</p>
          </div>
        
      ) : (
        <p className="join-error">No connection details. Please connect first.</p>
      )}

      {selectedTables.map((entry, index) => (
        <div key={index} className="table-selector">
          <h4>Table {index + 1}</h4>
          <div className="table-selector-row">
            <select
              value={entry.table}
              onChange={(e) => handleTableChange(index, e.target.value)}
              className="table-dropdown"
            >
              <option value="">--Select Table--</option>
              {availableTables.map(tbl => <option key={tbl} value={tbl}>{tbl}</option>)}
            </select>
            {index > 1 && (
              <button type="button" onClick={() => removeTable(index)} className="remove-btn">Remove</button>
            )}
          </div>
          {entry.table && (
            <div>
              <h4>Join Column</h4>
              <select
                value={entry.joinColumn}
                onChange={(e) => handleJoinColumnChange(index, e.target.value)}
                className="column-dropdown"
              >
                <option value="">--Select Column--</option>
                {entry.columns.map(col => <option key={col} value={col}>{col}</option>)}
              </select>
            </div>
          )}
        </div>
      ))}

      <button type="button" onClick={addTable} disabled={!connection} className="add-table-btn">+ Add Table</button>

      <div className="join-options">
        <h4>Join Type</h4>
        {['INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'FULL JOIN'].map(type => (
          <label key={type} className="join-radio">
            <input type="radio" name="joinType" value={type} checked={joinType === type} onChange={(e) => setJoinType(e.target.value)} />
            {type.replace(' JOIN', '')}
          </label>
        ))}
      </div>

      <div className="result-columns">
        <h4>Result Columns (comma-separated, optional)</h4>
        <input
          type="text"
          placeholder="e.g. table1.col1, table2.col2"
          value={resultColumns}
          onChange={(e) => setResultColumns(e.target.value)}
          className="columns-input"
        />
      </div>

      <button onClick={handleSubmit} disabled={!connection || selectedTables.length < 2} className="execute-join-btn">
        Execute Join
      </button>

      {error && <p className="join-error">{error}</p>}
    </div>
  );
}
