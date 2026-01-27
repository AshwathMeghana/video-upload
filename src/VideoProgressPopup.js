import React from "react";
import "./VideoProgressPopup.css";

function VideoProgressPopup({ onClose }) {
  return (
    <div className="popup-overlay">
      <div className="popup-box">
        <h3>Video Upload Progress</h3>
        <p>Currently processing 60%...</p>
        <button className="close-btn" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}

export default VideoProgressPopup;
