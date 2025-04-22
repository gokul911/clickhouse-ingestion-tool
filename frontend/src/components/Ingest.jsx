// src/components/Ingest.jsx
import React, { useState } from 'react';
import ColumnsCheckbox from './ColumnsCheckbox';
import { useNavigate } from 'react-router-dom';
import ProgressBar from './ProgressBar';
import "../styles/Ingest.css"
// import ExportCsvButton from './ExportCsvButton';

export default function Ingest({ connection }) {
  const [direction, setDirection] = useState('clickhouse_to_file');
  const [file, setFile] = useState(null);
  const [table, setTable] = useState('');
  const [columns, setColumns] = useState([]);
  const [selectedColumns, setSelectedColumns] = useState([]);
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleDirectionChange = (e) => setDirection(e.target.value);
  const handleFileChange = (e) => setFile(e.target.files[0]);
  const handleTableChange = (e) => setTable(e.target.value);

  const loadColumns = async () => {
    if (!connection || !table) {
      setError('Please connect and enter table name.');
      return;
    }

    const payload = { ...connection, table };
    setIsLoading(true);
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
    } finally {
      setIsLoading(false);
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
    setIsLoading(true);
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
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilePreview = async (file) => {
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    
    setIsLoading(true);
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
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    if (!connection) {
      setError("No connection info provided. Please connect first.");
      return;
    }

    setIsLoading(true);
  
    if (direction === 'clickhouse_to_file') {
      try {
        const payload = {
          connectionDetails: connection,
          table: table,
          selectedColumns: selectedColumns,
          delimiter: ','
        };
  
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/export-file`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
  
        if (!response.ok) {
          throw new Error('Failed to export CSV');
        }
  
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${table}_exported.csv`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        setError('');
        setResult(`Exported ${table}_exported.csv successfully!`);
  
      } catch (err) {
        setResult('');
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
      return;
    }
  
    // file_to_clickhouse logic as you already have it:
    setIsLoading(true);
    try {
      let response;
      const formData = new FormData();
      const connectionWithTable = { ...connection, table };
      formData.append('file', file);
      formData.append('connection', JSON.stringify(connectionWithTable));
      formData.append('selectedColumns', selectedColumns.join(','));
  
      response = await fetch(`${import.meta.env.VITE_API_URL}/api/import-file`, {
        method: 'POST',
        body: formData
      });
  
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
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="ingest-container">
      <ProgressBar visible={isLoading} />
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
          </>
        )}

        <button type="submit" disabled={!connection}>Ingest</button>
      </form>

      {result && <p className="success">{result}</p>}
      {error && <p className="error">{error}</p>}
    </div>
  );
}
