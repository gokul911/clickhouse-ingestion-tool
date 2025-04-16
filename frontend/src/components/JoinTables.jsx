// src/components/JoinTables.jsx

// import React, { useState, useEffect } from 'react';
// import axios from 'axios';
// import "../styles/JoinTables.css";

// export default function JoinTables({ connection }) {
//   const [availableTables, setAvailableTables] = useState([]);
//   const [selectedTables, setSelectedTables] = useState([{ table: '', columns: [], joinColumn: '' }]);
//   const [joinCondition, setJoinCondition] = useState('');
//   const [resultColumns, setResultColumns] = useState('');
//   const [joinType, setJoinType] = useState('INNER JOIN');
//   const [joinResult, setJoinResult] = useState([]);
//   const [error, setError] = useState('');

//   useEffect(() => {
//     if (!connection) return;
//     axios.post(`${import.meta.env.VITE_API_URL}/api/list-tables`, connection)
//       .then(res => setAvailableTables(res.data))
//       .catch(() => setError('Failed to load tables'));
//   }, [connection]);

//   const handleTableChange = (index, table) => {
//     const updated = [...selectedTables];
//     updated[index].table = table;
//     updated[index].joinColumn = '';

//     axios.post(`${import.meta.env.VITE_API_URL}/api/fetch-columns`, { ...connection, table })
//       .then(res => {
//         updated[index].columns = res.data;
//         setSelectedTables(updated);
//       })
//       .catch(() => {
//         updated[index].columns = [];
//         setError(`Failed to load columns for table ${table}`);
//         setSelectedTables(updated);
//       });
//   };

//   const handleJoinColumnChange = (index, joinColumn) => {
//     const updated = [...selectedTables];
//     updated[index].joinColumn = joinColumn;
//     setSelectedTables(updated);
//   };

//   const addTable = () => {
//     setSelectedTables([...selectedTables, { table: '', columns: [], joinColumn: '' }]);
//   };

//   const removeTable = (index) => {
//     const updated = selectedTables.filter((_, i) => i !== index);
//     setSelectedTables(updated);
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     if (selectedTables.length < 2) {
//       setError('Select at least two tables for a join.');
//       return;
//     }

//     const tables = selectedTables.map(item => item.table);
//     const condition = joinCondition || selectedTables
//       .slice(1)
//       .map((_, i) => `${selectedTables[i].table}.${selectedTables[i].joinColumn} = ${selectedTables[i + 1].table}.${selectedTables[i + 1].joinColumn}`)
//       .join(' AND ');

//     const payload = {
//       connection,
//       tables,
//       joinCondition: condition,
//       selectedColumns: resultColumns ? resultColumns.split(',').map(col => col.trim()) : [],
//       joinType
//     };

//     try {
//       const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/join`, payload);
//       setJoinResult(response.data);
//       setError('');
//     } catch (err) {
//       setError(err.response?.data?.error || err.message);
//       setJoinResult([]);
//     }
//   };

//   return (
//     <div className="p-4 max-w-3xl mx-auto font-sans">
//       <h2 className="text-2xl font-bold mb-4 text-center">Multi-Table Join</h2>

//       {connection ? (
//         <>
//           <h4 className="font-semibold">Connection Details:</h4>
//           <div style={{ border: '1px solid #ddd', padding: '10px', marginBottom: '10px' }}>
//             <p><strong>Host:</strong> {connection.host}</p>
//             <p><strong>Port:</strong> {connection.port}</p>
//             <p><strong>Database:</strong> {connection.database}</p>
//             <p><strong>User:</strong> {connection.user}</p>
//           </div>
//         </>
//       ) : (
//         <p style={{ color: 'red' }}>No connection details. Please connect first.</p>
//       )}

//       {selectedTables.map((entry, index) => (
//         <div key={index} className="mb-4">
//           <h4 className="font-semibold">Table {index + 1}</h4>
//           <div className="flex space-x-4 mb-2">
//             <select value={entry.table} onChange={(e) => handleTableChange(index, e.target.value)} className="border p-2 rounded">
//               <option value="">--Select Table--</option>
//               {availableTables.map(tbl => <option key={tbl} value={tbl}>{tbl}</option>)}
//             </select>
//             {index > 1 && (
//               <button type="button" onClick={() => removeTable(index)} className="bg-red-600 text-white px-2 py-1 rounded">Remove</button>
//             )}
//           </div>

//           {entry.table && (
//             <>
//               <h4 className="font-semibold">Join Column</h4>
//               <select value={entry.joinColumn} onChange={(e) => handleJoinColumnChange(index, e.target.value)} className="border p-2 w-full rounded">
//                 <option value="">--Select Column--</option>
//                 {entry.columns.map(col => <option key={col} value={col}>{col}</option>)}
//               </select>
//             </>
//           )}
//         </div>
//       ))}

//       <div className="mb-4">
//         <button type="button" onClick={addTable} disabled={!connection} className="bg-gray-700 text-white px-4 py-2 rounded">+ Add Table</button>
//       </div>

//       <div className="mb-4">
//         <h4 className="font-semibold">Join Type</h4>
//         <label className="mr-4">
//           <input type="radio" name="joinType" value="INNER JOIN" checked={joinType === "INNER JOIN"} onChange={(e) => setJoinType(e.target.value)} className="mr-2" />
//           Inner
//         </label>
//         <label className="mr-4">
//           <input type="radio" name="joinType" value="LEFT JOIN" checked={joinType === "LEFT JOIN"} onChange={(e) => setJoinType(e.target.value)} className="mr-2" />
//           Left
//         </label>
//         <label className="mr-4">
//           <input type="radio" name="joinType" value="RIGHT JOIN" checked={joinType === "RIGHT JOIN"} onChange={(e) => setJoinType(e.target.value)} className="mr-2" />
//           Right
//         </label>
//         <label>
//           <input type="radio" name="joinType" value="FULL JOIN" checked={joinType === "FULL JOIN"} onChange={(e) => setJoinType(e.target.value)} className="mr-2" />
//           Full
//         </label>
//       </div>

//       <div className="mb-4">
//         <h4 className="font-semibold">Result Columns (comma-separated, optional)</h4>
//         <input type="text" placeholder="e.g. table1.col1, table2.col2" value={resultColumns} onChange={(e) => setResultColumns(e.target.value)} className="border p-2 w-full rounded" />
//       </div>

//       <div className="mb-4">
//         <h4 className="font-semibold">Custom Join Condition (optional)</h4>
//         <textarea placeholder="Leave empty to auto-generate based on join columns" value={joinCondition} onChange={(e) => setJoinCondition(e.target.value)} className="border p-2 w-full rounded" rows="3" />
//       </div>

//       <button onClick={handleSubmit} disabled={!connection || selectedTables.length < 2}  className="bg-purple-600 text-white px-4 py-2 rounded w-full">Execute Join</button>

//       {error && <p className="mt-4 text-red-700">{error}</p>}

//       {joinResult.length > 0 && (
//         <table border="1" style={{ marginTop: '10px', width: '100%', borderCollapse: 'collapse' }}>
//           <thead>
//             <tr>
//               {Object.keys(joinResult[0]).map((col, idx) => (
//                 <th key={idx} style={{ padding: '8px', border: '1px solid #FFF' }}>{col}</th>
//               ))}
//             </tr>
//           </thead>
//           <tbody>
//             {joinResult.map((row, idx) => (
//               <tr key={idx}>
//                 {Object.values(row).map((val, index) => (
//                   <td key={index} style={{ padding: '8px', border: '1px solid #FFF' }}>
//                     {val !== null ? val.toString() : ''}
//                   </td>
//                 ))}
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       )}
//     </div>
//   );
// }

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import "../styles/JoinTables.css";

export default function JoinTables({ connection }) {
  const [availableTables, setAvailableTables] = useState([]);
  const [selectedTables, setSelectedTables] = useState([{ table: '', columns: [], joinColumn: '' }]);
  const [joinCondition, setJoinCondition] = useState('');
  const [resultColumns, setResultColumns] = useState('');
  const [joinType, setJoinType] = useState('INNER JOIN');
  // const [joinResult, setJoinResult] = useState([]);
  const [error, setError] = useState('');
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
    }
  };

  return (
    <div className="join-tables-container">
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

      {/* {joinResult.length > 0 && (
        <table className="result-table">
          <thead>
            <tr>
              {Object.keys(joinResult[0]).map((col, idx) => (
                <th key={idx}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {joinResult.map((row, idx) => (
              <tr key={idx}>
                {Object.values(row).map((val, index) => (
                  <td key={index}>{val !== null ? val.toString() : ''}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )} */}
    </div>
  );
}
