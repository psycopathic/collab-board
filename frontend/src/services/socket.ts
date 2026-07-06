import { io } from "socket.io-client";

const socket = io(import.meta.env.VITE_BACKEND_URL as string, {
  autoConnect: false,
});

export default socket;