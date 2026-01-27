import { useRef, useState, useEffect } from "react";
import uploadicon from "./upload-icon.png";
import "./App.css";
import VideoProgressPopup from "./VideoProgressPopup";
import LoginPage from "./LoginPage";
import CircularProgress from "./CircularProgress";
import axios from "axios";
import { getSocket, connectSocket, disconnectSocket, onRefresh } from "./socket";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    const user = localStorage.getItem("currentUser");
    return !!user;
  });

  const [showPopup, setShowPopup] = useState(false);
  const [tabIndex, setTabIndex] = useState(0);
  const fileInputRef = useRef(null);
  const [selectedVideos, setSelectedVideos] = useState([]);
  const [messages, setMessages] = useState([]);
  const [socketConnected, setSocketConnected] = useState(false); // ✅ use this stat
  // 🔹 Socket connection
  const [progress, setProgress] = useState(null);
  const [videoList, setVideoList] = useState([]);
  const [processedVideosList, setProcessedVideoList] = useState([]);
  const [uniqueFileCount, setUniqueFileCount] = useState(0);
  const [linearCount, setLinearCount] = useState(0);
  const [nightCount, setNightCount] = useState(0);
  const [fixedCount, setFixedCount] = useState(0);
  const [laneCount, setLaneCount] = useState(0);
  const [pendingVideos, setPendingVideos] = useState(0);
  const [processedVideos, setProcessedVideos] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedProcessedDate, setSelectedProcessedDate] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const [uploadStatus, setUploadStatus] = useState(null); // "success" | "error" | null
  const [uploadMessage, setUploadMessage] = useState("");
  const [isEmpty, setIsEmpty] = useState(true);
  const [timeTaken, setTimeTaken] = useState(0);

  // App.js (inside your App component)
  useEffect(() => {
    if (!isLoggedIn) return;  // only connect after login

    // 1️⃣ connect socket
    connectSocket();
    const socket = getSocket();

    // 2️⃣ listen to messages
    const handleProgress = (data) => {
      console.log("📩 Received:", data);

    };

    const handleRefresh = (data) => {
      console.log("🔄 Refresh data:", data);

      let parsed;

      try {
        parsed = typeof data === "string" ? JSON.parse(data) : data;
      } catch (e) {
        console.error("❌ Invalid JSON from backend:", data);
        return;
      }

      console.log("✅ Parsed refresh data:", parsed);

      // 🟢 Update progress FIRST
      if (typeof parsed.completionPercentage === "number") {
        setProgress(parsed.completionPercentage);
      }

      if (typeof parsed.remainingMinutes === "number") {
        setTimeTaken(parsed.remainingMinutes);
      }

      setVideoList((prev) => {

        if (!Array.isArray(parsed.videos) || parsed.videos.length === 0) {
          return prev;      // 🔒 retain previous data if empty / invalid refresh
        }
        return parsed.videos;      // 🟢 replace only when new data is valid
      });

    };

    socket.on("progress", handleProgress);
    socket.on("refresh", handleRefresh);

    // optional: handle disconnect
    socket.on("disconnect", () => {
      console.log("Socket disconnected");
    });

    return () => {
      socket.off("progress", handleProgress);
      socket.off("refresh", handleRefresh);
    };
  }, [isLoggedIn]);


  useEffect(() => {
    const savedProcessedDate = localStorage.getItem("selectedProcessedDate");
    const savedDate = localStorage.getItem("selectedDate");
    const savedTab = localStorage.getItem("selectedTab");

    if (savedProcessedDate) setSelectedProcessedDate(savedProcessedDate);
    if (savedDate) setSelectedDate(savedDate);
    if (savedTab !== null) setTabIndex(Number(savedTab));
  }, []);

  useEffect(() => {
    if (selectedDate) localStorage.setItem("selectedDate", selectedDate);
  }, [selectedDate]);

  useEffect(() => {
    if (selectedProcessedDate)
      localStorage.setItem("selectedProcessedDate", selectedProcessedDate);
  }, [selectedProcessedDate]);


  useEffect(() => {
    console.log("📩 messages state updated:", messages);
  }, [messages]);

  useEffect(() => {
    console.log("📹 videoList state updated:", videoList);
    if (Array.isArray(videoList) && videoList.length > 0 && tabIndex !== 1) {
      setTabIndex(1);
      localStorage.setItem("selectedTab", 1);

      loadProcessCount();

    }
  }, [videoList]);

  const handleStopConfirm = async () => {
    const selectedItems = selectedVideos.map(i => videoList[i]);
    console.log("🛑 Stopping videos:", selectedItems);
    // TODO: Call your STOP API here
    // stopVideos(selectedItems);
    const ids = selectedItems.map(item => item.id);
    const storedUser = localStorage.getItem("currentUser");
    const loggedInUser =
      storedUser && storedUser !== "undefined" ? JSON.parse(storedUser) : null;
    const token = loggedInUser?.access_token || "";
    const url = `http://localhost:3000/api/delete`;  // default when cleared

    const response = await fetch("http://localhost:3000/api/delete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(ids)   // 👈 send IDs here
    });


    if (!response.ok) {
      throw new Error("Request failed");
    }
    else {

    }
    setShowConfirm(false);
    setSelectedVideos([]);
  };


  const ProcessedVideoDetails = async (date) => {
    try {
      const storedUser = localStorage.getItem("currentUser");
      const loggedInUser =
        storedUser && storedUser !== "undefined" ? JSON.parse(storedUser) : null;

      const token = loggedInUser?.access_token || "";

      const today = new Date().toISOString().split("T")[0];

      const url = date
        ? `http://localhost:3000/api/getVideoProcessedDataHistory?date=${date}`
        : `http://localhost:3000/api/getVideoProcessedDataHistory`;  // default when cleared

      const response = await fetch(url, {
        method: "GET",
      });

      if (!response.ok) {

        throw new Error("Request failed");
      }
      else {

      }
      const data = await response.json();
      if (data) {
        setProcessedVideoList(data.data);
      }

    } catch (err) {
      console.error("❌ Failed to load process count", err);
    }
  };
  useEffect(() => {
    setIsEmpty(!Array.isArray(videoList) || videoList.length === 0);
  }, [videoList]);
  useEffect(() => {
    if (uploadStatus) {
      const timer = setTimeout(() => {
        setUploadStatus(null);
        setUploadMessage("");
      }, 2000);   // ⏱ disappears in 2 seconds

      return () => clearTimeout(timer);
    }
  }, [uploadStatus]);

  useEffect(() => {
    if (tabIndex === 2 && selectedDate) {
      ProcessedVideoDetails(selectedDate);
    }
  }, [tabIndex, selectedDate]);

  useEffect(() => {
    if (tabIndex === 1 && selectedProcessedDate) {
      loadProcessCount(selectedProcessedDate);
    }
  }, [tabIndex, selectedProcessedDate]);


  useEffect(() => {
    if (selectedDate) {
      localStorage.setItem("selectedDate", selectedDate);
    } else {
      localStorage.removeItem("selectedDate");
    }
  }, [selectedDate]);

  useEffect(() => {
    if (selectedProcessedDate) {
      localStorage.setItem("selectedProcessedDate", selectedProcessedDate);
    } else {
      localStorage.removeItem("selectedProcessedDate");
    }
  }, [selectedProcessedDate]);

  const handleImageClick = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  useEffect(() => {
    const savedTab = localStorage.getItem("selectedTab");
    if (savedTab !== null) {
      setTabIndex(Number(savedTab));
    }
  }, []);

  const uploadVideos = async (files) => {
    try {
      setUploadStatus("uploading");
      setUploadMessage(`Uploading ${files.length} videos...`);

      const formData = new FormData();

      files.forEach((file) => {
        formData.append("files", file);   // 👈 important
      });

      const res = await axios.post(
        "http://localhost:3000/api/uploads",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      setUploadStatus("success");
      setUploadMessage("All videos uploaded successfully!");
    } catch (error) {
      console.error("Upload error:", error);

      let msg = "Upload failed.";

      if (error.response) {
        msg = `Upload failed: ${error.response.status} ${error.response.statusText}`;
      } else if (error.request) {
        msg = "Server not responding.";
      }

      setUploadStatus("error");
      setUploadMessage(msg);
    }
  };

  // latest
  // const uploadVideo = async (file) => {
  //   try {
  //     setUploadStatus("uploading");
  //     setUploadMessage("Uploading video...");

  //     const formData = new FormData();
  //     formData.append("file", file);

  //     const res = await axios.post("http://localhost:3000/api/uploads", formData);

  //     setUploadStatus("success");
  //     setUploadMessage("Video uploaded successfully!");
  //   } catch (error) {
  //     console.error("Upload error:", error);

  //     let msg = "Upload failed.";

  //     if (error.response) {
  //       msg = `Upload failed: ${error.response.status} ${error.response.statusText}`;
  //     } else if (error.request) {
  //       msg = "Server not responding.";
  //     }

  //     setUploadStatus("error");
  //     setUploadMessage(msg);
  //   }
  // };


  //   try {
  //     setUploadStatus(null);
  //     setUploadMessage("Uploading...");

  //     const formData = new FormData();
  //     formData.append("file", file);

  //     const res = await axios.post("http://localhost:3000/api/uploads", formData);

  //     setUploadStatus("success");
  //     setUploadMessage("Upload successful!");

  //   } catch (error) {
  //     console.error("Upload error:", error);

  //     let message = "Upload failed.";

  //     if (error.response) {
  //       message = `Upload failed: ${error.response.status} ${error.response.statusText}`;
  //     } else if (error.request) {
  //       message = "Server not responding.";
  //     } else {
  //       message = "Upload error occurred.";
  //     }

  //     setUploadStatus("error");
  //     setUploadMessage(message);
  //   }
  //   };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  // const handleDrop = (e) => {
  //   e.preventDefault();
  //   const file = e.dataTransfer.files[0];
  //   if (file) {
  //     uploadVideo(file);
  //   }
  // };

  const handleDrop = (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) uploadVideos(files);
  };



  const handleLogout = () => {
    disconnectSocket(); // closes the socket completely
    setIsLoggedIn(false);
    localStorage.setItem("selectedTab", 0);
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("currentUser");
    setMessages([]); // optional: clear messages
  };

  if (!isLoggedIn) {
    return <LoginPage onLogin={() => setIsLoggedIn(true)} />;
  }


  const handleSelect = (index) => {
    if (selectedVideos.includes(index)) {
      setSelectedVideos(selectedVideos.filter((i) => i !== index));
    } else {
      setSelectedVideos([...selectedVideos, index]);
    }
  };

  const loadProcessCount = async (date) => {
    try {
      const storedUser = localStorage.getItem("currentUser");
      const loggedInUser =
        storedUser && storedUser !== "undefined" ? JSON.parse(storedUser) : null;

      const token = loggedInUser?.access_token || "";

      const today = new Date().toISOString().split("T")[0];
      let url = date ? `date=${date}` : `date=${today}`;
      const response = await fetch(
        `http://localhost:3000/api/getVideoProcessCount?${url}`,
        {
          method: "GET",
        }
      );

      if (!response.ok) {
        throw new Error("Request failed");
      }
      setLinearCount(0);
      setNightCount(0);
      setFixedCount(0);
      setLaneCount(0);
      setUniqueFileCount(0);
      setPendingVideos(0);
      setProcessedVideos(0);
      const data = await response.json();
      if (data?.details?.uniqueFilesToday?.length > 0) {
        setUniqueFileCount(data.details.uniqueFilesToday[0].UniqueFileCount);
      }

      if (data?.details?.["Total Asset type Count"]?.length > 0) {
        data.details["Total Asset type Count"].forEach(asset => {
          if (asset?.asset_type === "linear:other-linears") {
            setLinearCount(asset.count);
          }
          if (asset?.asset_type === "electrical-reflective") {
            setNightCount(asset.count);
          }
          if (asset?.asset_type === "fixed") {
            setFixedCount(asset.count);
          }
          if (asset?.asset_type === "linear:thermoplastic-paint") {
            setLaneCount(asset.count);
          }
        });
      }

      if (data?.details?.pendingVideos?.length > 0) {
        setPendingVideos(data.details.pendingVideos[0].PendingVideos);
      }

      if (data?.details?.processedVideos?.length > 0) {
        setProcessedVideos(data.details.processedVideos[0].ProcessedVideos);
      }

      console.log("📊 Today's process count:", data);

    } catch (err) {
      console.error("❌ Failed to load process count", err);
    }
  };

  const videoProcessDetails = () => {
    setTabIndex(1);
    localStorage.setItem("selectedTab", 1);
    loadProcessCount();
  };

  const toggleSelect = (index) => {
    setSelectedVideos((prev) =>
      prev.includes(index)
        ? prev.filter((i) => i !== index)
        : [...prev, index]
    );
  };

  const videoProcessedDetails = () => {
    setTabIndex(2);
    localStorage.setItem("selectedTab", 2);
    ProcessedVideoDetails();
  };

  const landingPage = () => {
    setTabIndex(0);
    localStorage.setItem("selectedTab", 0);
  }

  return (
    <div className="App">
      <div className="AppHeader">
        <div className="left-section">
          <img
            src="/static/media/logo.39fbbbbe5208cdbdf802.png"
            className="App-logo"
            alt="logo"
          />
        </div>

        <div className="logout-btn" onClick={handleLogout}>
          Logout
        </div>
      </div>

      <div className="tab-container">
        <div className="tab-buttons">
          <button className={tabIndex === 0 ? "tabs selected-tab" : "tabs"} onClick={() => landingPage()}>Upload Videos</button>
          <hr />
          <button className={tabIndex === 1 ? "tabs selected-tab" : "tabs"} onClick={() => videoProcessDetails()}>Video Processing Details</button>
          <hr />
          <button className={tabIndex === 2 ? "tabs selected-tab" : "tabs"} onClick={() => videoProcessedDetails()}>Video Processed Details</button>
        </div>
      </div>

      {tabIndex === 0 && (
        <div
          className="upload-outline"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <div className="upload-content">
            <img
              src={uploadicon}
              className="App-upload"
              alt="Upload Icon"
              onClick={handleImageClick}
              style={{ cursor: "pointer" }}
            />
            {/* <input
              type="file"
              ref={fileInputRef}
              accept="video/*"
              onChange={(e) => uploadVideo(e.target.files[0])}
              style={{ display: "none" }}
            /> */}
            <input
              type="file"
              ref={fileInputRef}
              accept="video/*"
              multiple
              onChange={(e) => {
                const files = Array.from(e.target.files);
                if (files.length > 0) uploadVideos(files);
              }}

              style={{ display: "none" }}
            />

            <p className="text">Drag & Drop video here or click to uploads</p>
          </div>

        </div>
      )}

      {/* 🔹 Tab 2: Progress Bar */}

      {tabIndex === 1 && (
        <div className="page-container">
          <div className="split-screen">
            <div className="progress-container">
              {/* 🔹 Search Input */}
              {/* <input
                type="text"
                placeholder="Search..."
                className="searchBar"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              /> */}

              {!isEmpty && (
                <>
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${progress ?? 0}%` }}
                    ></div>
                  </div>

                  <p className="progress-text">{progress ?? 0}%</p>
                  <p className="progress-text">
                    Estimated Time Taken for Videos to Complete Processing : {timeTaken} Mins
                  </p>
                </>
              )}


              <div
                className="video-grid"
                style={{
                  height: isEmpty ? "undefined" : "45vh",
                  padding: isEmpty ? "0" : undefined
                }}
              >
                {/* Empty state message (NO SCROLL) */}
                {isEmpty && (
                  <div className="no-videos-text">
                    No videos available. Click on{" "}
                    <span className="upload-link" style={{ cursor: 'pointer' }} onClick={() => landingPage()}>
                      Upload Videos
                    </span>{" "}
                    tab to add videos.
                  </div>
                )}

                {/* Grid only exists when there are videos */}
                {!isEmpty && (
                  <div className="video-grid"  >
                    {videoList
                      .filter(
                        (message) =>
                          message.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          message.asset_type?.toLowerCase().includes(searchTerm.toLowerCase())
                      )
                      .map((message, i) => {
                        const isSelected = selectedVideos.includes(i);

                        return (
                          <div
                            key={i}
                            onClick={() => toggleSelect(i)}
                            className={`video-card ${isSelected ? "selected" : ""}`}
                          >
                            <div>
                              {message.name.length > 12
                                ? message.name.slice(0, 12) + "..."
                                : message.name}
                            </div>

                            <div>{message.asset_type}</div>

                            <div className="progress-wrapper">
                              <CircularProgress value={message.progress ?? 0} />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}

              </div>

              {selectedVideos.length > 0 && <button className="btn" onClick={() => setShowConfirm(true)}>STOP</button>}
            </div>
          </div>

          <div className="date-row">
            <label className="no-videos-text">
              Processed Video Details For Date:
            </label>

            <input
              type="date"
              value={selectedProcessedDate || ""}
              onChange={(e) => setSelectedProcessedDate(e.target.value || null)}
            />
          </div>

          <div className="row">
            <div className="current-updates">
              <div className="value">{uniqueFileCount}</div>
              <div>UNIQUE VIDEOS</div>
            </div>
            <div className="current-updates">
              <div className="value">{linearCount}</div>
              <div>LINEAR</div>
            </div>
            <div className="current-updates">
              <div className="value">{fixedCount}</div>
              <div>FIXED</div>
            </div>
            <div className="current-updates">
              <div className="value">{laneCount}</div>
              <div>LANE</div>
            </div>
            <div className="current-updates">
              <div className="value">{nightCount}</div>
              <div>NIGHT</div>
            </div>
            <div className="current-updates">
              <div className="value">{pendingVideos}</div>
              <div>QUEUED VIDEOS</div>
            </div>
            <div className="current-updates">
              <div className="value">{processedVideos}</div>
              <div>PROCESSED VIDEOS  (Linear + Fixed + Lane + Night) </div>
            </div>
          </div>
        </div>
      )}

      {tabIndex === 2 && (
        <div className="blocks-wrapper">
          <div className="dashboard-panel">

            <div className="date-picker">
              <label>Select Date</label>
              <input
                type="date"
                value={selectedDate || ""}
                onChange={(e) => setSelectedDate(e.target.value || null)}
              />
            </div>

            {/* <div className="blocks-column">
              {processedVideosList.map((block) => {
                const isDanger = block.rows.some(row => row.label === "Failed" && row.value > 0);
                const isWarning = block.rows.some(row => row.label === "Queued" && row.value > 10);

                return (
                  <div
                    className={`white-block ${isDanger ? "danger" : isWarning ? "warning" : "safe"}`}
                    key={block.id}
                  >
                    <div className="block-title">{block.title}</div>

                    {block.rows.map((row, i) => (
                      <div className="block-row" key={i}>
                        <span>{row.label}</span>
                        <span>{row.value}</span>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div> */}

            <div className="blocks-column">
              {processedVideosList.map((block, index) => {

                const rows = [
                  { label: "Total", value: block.totalCount },
                  { label: "Processed", value: block.totalProcessed },
                  { label: "Not Processed", value: block.totalNotProcessed },
                  { label: "Failed", value: block.totalErrorVideos }
                ];

                const isDanger = block.totalErrorVideos > 0;
                const isWarning = block.totalNotProcessed > 0 && block.totalErrorVideos === 0;

                return (
                  <div
                    key={index}
                    className={`white-block ${isDanger ? "danger" : isWarning ? "warning" : "safe"}`}
                  >
                    <div className="block-title">{block.date}</div>

                    {rows.map((row, i) => (
                      <div className="block-row" key={i}>
                        <span>{row.label}</span>
                        <span>{row.value}</span>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>

          </div>
        </div>
      )}

      {showPopup && <VideoProgressPopup onClose={() => setShowPopup(false)} />}
      {showConfirm && (
        <div className="confirm-overlay">
          <div className="confirm-box">
            <h3 style={{ fontFamily: 'system-ui', justifyContent: 'left', display: 'flex', color: '#ff0e00' }}>Confirm</h3>
            <hr />
            <p style={{ fontFamily: 'system-ui', padding: '4px', justifyContent: 'start', display: 'flex' }}>Are you sure you want to stop {selectedVideos.length} selected video(s)?</p>

            <div className="confirm-actions">
              <button style={{ padding: '5px', borderRadius: '4px', cursor: 'pointer' }} className="cancel" onClick={() => setShowConfirm(false)}>Cancel</button>
              <button style={{ padding: '5px', borderRadius: '4px', cursor: 'pointer' }} className="danger" onClick={handleStopConfirm}>Stop</button>
            </div>
          </div>
        </div>
      )}

      {uploadStatus && (
        <div className={`toast ${uploadStatus}`}>
          {uploadMessage}
        </div>
      )}

    </div>
  );
}

export default App;

