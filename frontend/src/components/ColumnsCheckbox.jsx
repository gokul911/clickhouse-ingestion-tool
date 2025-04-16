// src/components/ColumnsCheckbox.jsx
import "../styles/ColumnsCheckbox.css"
export default function ColumnsCheckbox({ columns, selected, onChange }) {
  const handleCheckbox = (col) => {
    const updated = selected.includes(col)
      ? selected.filter(item => item !== col)
      : [...selected, col];
    onChange(updated);
  };

  return (
    <div>
      <h4>Select Columns</h4>
      <ul>
        {columns.map((col) => (
          <li key={col}>
            <label>
              <input
                type="checkbox"
                checked={selected.includes(col)}
                onChange={() => handleCheckbox(col)}
              />
              {col}
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}