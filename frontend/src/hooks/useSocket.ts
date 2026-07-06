import { useEffect, useState } from "react";

import socket from "../services/socket";
import type { ConnectionStatus } from "../types/collaboration";

export const BOARD_ID = "board-1";
const USER_NAME_STORAGE_KEY = "collab-board:user-name";

const getStoredUserName = () => {
  if (typeof window === "undefined") {
    return "Guest";
  }

  const existingName = window.localStorage.getItem(USER_NAME_STORAGE_KEY);

  if (existingName) {
    return existingName;
  }

  const generatedName = `User ${Math.random().toString(36).slice(2, 6)}`;
  window.localStorage.setItem(USER_NAME_STORAGE_KEY, generatedName);
  return generatedName;
};

export const useSocket = () => {
  const [status, setStatus] = useState<ConnectionStatus>(
    socket.connected ? "connected" : "disconnected",
  );
  const [userName] = useState(getStoredUserName);

  useEffect(() => {
    const handleConnect = () => {
      setStatus("connected");
      console.log("Connected");

      socket.emit("board:join", {
        boardId: BOARD_ID,
        name: userName,
      });
    };

    const handleDisconnect = (reason: string) => {
      setStatus(reason === "io client disconnect" ? "disconnected" : "reconnecting");
      console.log("Disconnected");
    };

    const handleReconnectAttempt = () => {
      setStatus("reconnecting");
    };

    const handleReconnect = () => {
      setStatus("connected");
    };

    const handleReconnectFailed = () => {
      setStatus("disconnected");
    };

    const handleBoardJoined = (data: unknown) => {
      console.log("Joined board", data);
    };

    const handleUserJoined = (data: unknown) => {
      console.log("Another user joined", data);
    };

    const handleBoardError = (error: unknown) => {
      console.error("Board error", error);
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("board:joined", handleBoardJoined);
    socket.on("board:user-joined", handleUserJoined);
    socket.on("board:error", handleBoardError);
    socket.io.on("reconnect_attempt", handleReconnectAttempt);
    socket.io.on("reconnect", handleReconnect);
    socket.io.on("reconnect_error", handleReconnectAttempt);
    socket.io.on("reconnect_failed", handleReconnectFailed);

    socket.connect();

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("board:joined", handleBoardJoined);
      socket.off("board:user-joined", handleUserJoined);
      socket.off("board:error", handleBoardError);
      socket.io.off("reconnect_attempt", handleReconnectAttempt);
      socket.io.off("reconnect", handleReconnect);
      socket.io.off("reconnect_error", handleReconnectAttempt);
      socket.io.off("reconnect_failed", handleReconnectFailed);

      socket.disconnect();
    };
  }, [userName]);

  return {
    socket,
    status,
    userName,
  };
};
