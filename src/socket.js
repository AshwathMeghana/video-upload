import io from "socket.io-client";

let socket = null;

export const getSocket = () => {
  if (!socket) {
    socket = io("http://localhost:10025", {
      autoConnect: true,
      reconnection: false,
      transports: ["websocket"], // 🚀 avoid polling issues
      timeout: 4500000,            // ⏱ wait longer for handshake
      query: { username: "frontend" } 
    });

    socket.on("connect", () => {
      console.log("🔵 Connected:", socket.id);
    });

    socket.on("disconnect", (reason) => {
      console.log("🔴 Disconnected:", reason);
    });

    socket.on("connect_error", (err) => {
      console.log("❌ Connect error:", err.message);
    });
  }
  return socket;
};

export const connectSocket = () => {
  const s = getSocket();
  if (!s.connected) s.connect();
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
