import React from "react";
import "./CircularProgress.css";

const CircularProgress = ({ value }) => {
  const radius = 50;
  const stroke = 10;
  const normalizedRadius = radius - stroke * 0.5;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset =
    circumference - (value / 100) * circumference;

  return (
    <div className="circular-wrapper">
      <svg height="140" width="140">
        <circle
          className="bg-circle"
          strokeWidth={stroke}
          r={normalizedRadius}
          cx="70"
          cy="70"
        />
        <circle
          className="progress-circle"
          strokeWidth={stroke}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          r={normalizedRadius} 
          cx="70"
          cy="70"
        />
      </svg>

      <div className="progress-value">{value}%</div>
    </div>
  );
};

export default CircularProgress;
