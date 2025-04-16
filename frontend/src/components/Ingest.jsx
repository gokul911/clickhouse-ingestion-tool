// src/components/Ingest.jsx
import React, { useState } from 'react';
import ColumnsCheckbox from './ColumnsCheckbox';
import { useNavigate } from 'react-router-dom';
import "../styles/Ingest.css"

export default function Ingest({ connection }) {
  const [direction, setDirection] = useState('clickhouse_to_file');
  const [filePath, setFilePath] = useState('');
  const [file, setFile] = useState(null);
  const [table, setTable] = useState('');
  const [columns, setColumns] = useState([]);
  const [selectedColumns, setSelectedColumns] = useState([]);
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleDirectionChange = (e) => setDirection(e.target.value);
  const handleFilePathChange = (e) => setFilePath(e.target.value);
  const handleFileChange = (e) => setFile(e.target.files[0]);
  const handleTableChange = (e) => setTable(e.target.value);

  const loadColumns = async () => {
    if (!connection || !table) {
      setError('Please connect and enter table name.');
      return;
    }

    const payload = { ...connection, table };
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/fetch-columns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const data = await response.json();
        setColumns(data);
        setSelectedColumns(data);  // Preselect all by default
        setError('');
      } else {
        setError('Failed to fetch columns');
      }
    } catch (err) {
      setError('Error: ' + err.message);
    }
  };

  const handleTablePreview = async () => {
    if (!connection) {
      setError('No connection info provided. Please connect first.');
      return;
    }

    if (!table) {
      setError('Please enter a table name.');
      return;
    }

    const payload = { ...connection, table };

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/preview-table`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        const data = await response.json();
        // Store in sessionStorage and navigate
        sessionStorage.setItem('previewData', JSON.stringify(data));
        sessionStorage.setItem('previewError', '');
        navigate('/preview');
      } else {
        const errorMsg = 'Failed to fetch preview data';
        sessionStorage.setItem('previewData', JSON.stringify([]));
        sessionStorage.setItem('previewError', errorMsg);
        setError(errorMsg);
        navigate('/preview');
      }
    } catch (err) {
      sessionStorage.setItem('previewData', JSON.stringify([]));
      sessionStorage.setItem('previewError', err.message);
      setError(err.message);
      navigate('/preview');
    }
  };

  const handleFilePreview = async (file) => {
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
  
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/preview-csv`, {
        method: 'POST',
        body: formData
      });
  
      const data = await response.json();
      if (response.ok) {
        sessionStorage.setItem('previewData', JSON.stringify(data));
        sessionStorage.setItem('previewError', '');
        navigate('/preview');  // Navigate to your DataTable
      } else {
        sessionStorage.setItem('previewData', JSON.stringify([]));
        sessionStorage.setItem('previewError', data.error || 'Failed to preview CSV');
        navigate('/preview'); 
      }
    } catch (err) {
      sessionStorage.setItem('previewData', JSON.stringify([]));
      sessionStorage.setItem('previewError', err.message);
      navigate('/preview'); 
    }
  };
  

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!connection) {
      setError("No connection info provided. Please connect first.");
      return;
    }

    try {
      let response;

      if (direction === 'file_to_clickhouse') {
        const formData = new FormData();
        const connectionWithTable = { ...connection, table };
        formData.append('file', file);
        formData.append('connection', JSON.stringify(connectionWithTable));
        formData.append('selectedColumns', selectedColumns.join(','));

        response = await fetch(`${import.meta.env.VITE_API_URL}/api/ingest-file`, {
          method: 'POST',
          body: formData
        });
      } else {
        const payload = { 
          direction,
          connection: { ...connection, table },
          selectedColumns,
          filePath
        };

        response = await fetch(`${import.meta.env.VITE_API_URL}/api/ingest`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      const data = await response.json();
      if (response.ok) {
        setResult(`Ingested ${data.count} rows successfully`);
        setError('');
      } else {
        setResult('');
        setError(data.error || 'Unknown error');
      }
    } catch (err) {
      setResult('');
      setError(err.message);
    }
  };

  return (
    <div className="ingest-container">
      <h2>Ingest Data</h2>
      <form onSubmit={handleSubmit}>
        <label>
          Direction:
          <select value={direction} onChange={handleDirectionChange}>
            <option value="clickhouse_to_file">ClickHouse to File</option>
            <option value="file_to_clickhouse">File to ClickHouse</option>
          </select>
        </label>

        <h4>Connection Details:</h4>
        {connection ? (
          <div className="connection-details">
            <p><strong>Host:</strong> {connection.host}</p>
            <p><strong>Port:</strong> {connection.port}</p>
            <p><strong>Database:</strong> {connection.database}</p>
            <p><strong>User:</strong> {connection.user}</p>
          </div>
        ) : (
          <p className="error">No connection details. Please connect first.</p>
        )}

        <h4>Other Details:</h4>

        <input
          type="text"
          placeholder="Table Name"
          value={table}
          onChange={handleTableChange}
        />
        <button type='button' onClick={handleTablePreview} disabled={!connection || !table}>Preview Table</button>
        
        {direction !== 'file_to_clickhouse' && <button type="button" disabled={!connection} onClick={loadColumns}>
          Load Columns
        </button>}

        {direction === 'file_to_clickhouse' ? (
          <div className='file-to-clickhouse-container'>
            <input 
              type="file" 
              onChange={handleFileChange} 
            />
            <button type="button" onClick={() => handleFilePreview(file)} disabled={!file}>Preview CSV</button>
          </div>
        ) : (
          <>
            {columns.length > 0 && (
              <ColumnsCheckbox
                columns={columns}
                selected={selectedColumns}
                onChange={setSelectedColumns}
              />
            )}
            <input
              type="text"
              placeholder="File Path"
              value={filePath}
              onChange={handleFilePathChange}
            />
          </>
        )}

        <button type="submit" disabled={!connection}>Ingest</button>
      </form>

      {result && <p className="success">{result}</p>}
      {error && <p className="error">{error}</p>}
    </div>
  );
}
