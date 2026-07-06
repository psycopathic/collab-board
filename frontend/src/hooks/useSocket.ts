import { useEffect, useState } from "react";

import socket from "../services/socket";
import type { BoardJoinedPayload, ConnectionStatus, HostChangedPayload } from "../types/collaboration";

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

export const useSocket = (boardId?: string) => {
  const [status, setStatus] = useState<ConnectionStatus>(
    socket.connected ? "connected" : "disconnected",
  );
  const [userName] = useState(getStoredUserName);
  const [isHost, setIsHost] = useState(false);
  const [hostSocketId, setHostSocketId] = useState<string | null>(null);

  useEffect(() => {
    if (!boardId) {
      return;
    }

    const handleConnect = () => {
      setStatus("connected");
      console.log("Connected");

      socket.emit("board:join", {
        boardId,
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

    const handleBoardJoined = (data: BoardJoinedPayload) => {
      console.log("Joined board", data);
      setIsHost(Boolean(data.isHost));
      setHostSocketId(data.hostSocketId ?? null);
    };

    const handleHostChanged = (data: HostChangedPayload) => {
      setHostSocketId(data.hostSocketId);
      setIsHost(data.hostSocketId === socket.id);
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
    socket.on("host:changed", handleHostChanged);
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
      socket.off("host:changed", handleHostChanged);
      socket.off("board:user-joined", handleUserJoined);
      socket.off("board:error", handleBoardError);
      socket.io.off("reconnect_attempt", handleReconnectAttempt);
      socket.io.off("reconnect", handleReconnect);
      socket.io.off("reconnect_error", handleReconnectAttempt);
      socket.io.off("reconnect_failed", handleReconnectFailed);

      socket.disconnect();
      setIsHost(false);
      setHostSocketId(null);
    };
  }, [userName, boardId]);

  return {
    socket,
    status,
    userName,
    isHost,
    hostSocketId,
  };
};