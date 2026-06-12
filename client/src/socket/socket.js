import { io } from "socket.io-client";

export const socket = io(
  import.meta.env.VITE_SOCKET_URL || "http://localhost:5000",
  {
    autoConnect: false,

    auth: {},
  },
);

export const connectSocket = () => {
  const token = localStorage.getItem("token");

  socket.auth = {
    token,
  };

  if (!socket.connected) {
    socket.connect();
  }

  socket.emit("register-user");
};

export const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect();
  }
};
