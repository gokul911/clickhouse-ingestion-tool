// src/components/DataTable.jsx
import React, { useState, useEffect } from 'react';
import "../styles/DataTable.css";

export default function DataTable() {
  const [previewData, setPreviewData] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    // Get data from sessionStorage
    const storedData = sessionStorage.getItem('previewData');
    const storedError = sessionStorage.getItem('previewError');
    
    if (storedData) {
      setPreviewData(JSON.parse(storedData));
    }
    
    if (storedError) {
      setError(storedError);
    }
    
    // Optional: clear after retrieving
    sessionStorage.removeItem('previewData');
    sessionStorage.removeItem('previewError');
  }, []);

  console.log(error, " , ", previewData);

  return (
    <div className="table-container">
      <h2>Data Preview</h2>
      
      {error && <p className="error">{error}</p>}
      
      {!error && previewData.length > 0 && (
        <table className="preview-table">
          <thead>
            <tr>
              {Object.keys(previewData[0]).map((col, idx) => (
                <th key={idx}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {previewData.map((row, idx) => (
              <tr key={idx}>
                {Object.values(row).map((val, index) => (
                  <td key={index}>{val}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
      
      {!error && previewData.length === 0 && (
        <p>No data to display</p>
      )}
    </div>
  );
}