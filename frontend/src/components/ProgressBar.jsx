// src/components/ProgressBar.jsx
import React from 'react';
import "../styles/ProgressBar.css";

export default function ProgressBar({ visible }) {
  if (!visible) return null;
  return (
    <div className="progress-overlay">
      <div className="progress-bar">
        <div className="progress-indicator"></div>
      </div>
    </div>
  );
}
