import { useEffect, useRef, useState } from "react";
import type { Socket } from "socket.io-client";

import type {
  CursorUpdatePayload,
  DrawingUpdatePayload,
  PresenceUpdatePayload,
  PresenceUser,
  UserNotification,
} from "../types/collaboration";

interface UsePresenceOptions {
  socket: Socket;
  boardId: string;
}

const CURSOR_THROTTLE_MS = 40;
const NOTIFICATION_TIMEOUT_MS = 3000;

export const usePresence = ({ socket, boardId }: UsePresenceOptions) => {
  const [users, setUsers] = useState<PresenceUser[]>([]);
  const [cursors, setCursors] = useState<CursorUpdatePayload[]>([]);
  const [drawingUsers, setDrawingUsers] = useState<PresenceUser[]>([]);
  const [notifications, setNotifications] = useState<UserNotification[]>([]);

  const lastCursorSentAtRef = useRef(0);
  const pendingCursorRef = useRef<{ x: number; y: number } | null>(null);
  const cursorTimeoutRef = useRef<number | null>(null);
  const notificationTimeoutsRef = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    const addNotification = (message: string) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      setNotifications((current) => [...current, { id, message }]);

      const timeoutId = window.setTimeout(() => {
        setNotifications((current) => current.filter((notification) => notification.id !== id));
        notificationTimeoutsRef.current.delete(id);
      }, NOTIFICATION_TIMEOUT_MS);

      notificationTimeoutsRef.current.set(id, timeoutId);
    };

    const handlePresenceUpdate = ({ users: nextUsers }: PresenceUpdatePayload) => {
      setUsers(nextUsers);
      setCursors((current) =>
        current.filter((cursor) => nextUsers.some((user) => user.socketId === cursor.socketId)),
      );
      setDrawingUsers((current) =>
        current.filter((user) => nextUsers.some((nextUser) => nextUser.socketId === user.socketId)),
      );
    };

    const handleCursorUpdate = (payload: CursorUpdatePayload) => {
      setCursors((current) => {
        const withoutCurrent = current.filter((cursor) => cursor.socketId !== payload.socketId);
        return [...withoutCurrent, payload];
      });
    };

    const handleUserJoined = (user: PresenceUser) => {
      addNotification(`${user.name} joined the board`);
    };

    const handleUserLeft = (user: PresenceUser) => {
      addNotification(`${user.name} left the board`);
      setCursors((current) => current.filter((cursor) => cursor.socketId !== user.socketId));
      setDrawingUsers((current) => current.filter((member) => member.socketId !== user.socketId));
    };

    const handleDrawingUpdate = ({ isDrawing, ...user }: DrawingUpdatePayload) => {
      setDrawingUsers((current) => {
        if (!isDrawing) {
          return current.filter((member) => member.socketId !== user.socketId);
        }

        const withoutCurrent = current.filter((member) => member.socketId !== user.socketId);
        return [...withoutCurrent, user];
      });
    };

    socket.on("presence:update", handlePresenceUpdate);
    socket.on("cursor:update", handleCursorUpdate);
    socket.on("user:joined", handleUserJoined);
    socket.on("user:left", handleUserLeft);
    socket.on("drawing:update", handleDrawingUpdate);

    return () => {
      socket.off("presence:update", handlePresenceUpdate);
      socket.off("cursor:update", handleCursorUpdate);
      socket.off("user:joined", handleUserJoined);
      socket.off("user:left", handleUserLeft);
      socket.off("drawing:update", handleDrawingUpdate);

      if (cursorTimeoutRef.current) {
        window.clearTimeout(cursorTimeoutRef.current);
      }

      notificationTimeoutsRef.current.forEach((timeoutId) => {
        window.clearTimeout(timeoutId);
      });
      notificationTimeoutsRef.current.clear();
    };
  }, [socket]);

  const flushPendingCursor = () => {
    if (!pendingCursorRef.current) return;

    socket.emit("cursor:move", {
      boardId,
      x: pendingCursorRef.current.x,
      y: pendingCursorRef.current.y,
    });
    lastCursorSentAtRef.current = Date.now();
    pendingCursorRef.current = null;
    cursorTimeoutRef.current = null;
  };

  const emitCursorMove = (x: number, y: number) => {
    const now = Date.now();
    const elapsed = now - lastCursorSentAtRef.current;

    if (elapsed >= CURSOR_THROTTLE_MS) {
      socket.emit("cursor:move", { boardId, x, y });
      lastCursorSentAtRef.current = now;
      pendingCursorRef.current = null;
      return;
    }

    pendingCursorRef.current = { x, y };

    if (cursorTimeoutRef.current !== null) return;

    cursorTimeoutRef.current = window.setTimeout(
      flushPendingCursor,
      CURSOR_THROTTLE_MS - elapsed,
    );
  };

  const emitDrawingStart = () => {
    socket.emit("drawing:start", { boardId });
  };

  const emitDrawingStop = () => {
    socket.emit("drawing:stop", { boardId });
  };

  return {
    users,
    cursors,
    drawingUsers,
    notifications,
    emitCursorMove,
    emitDrawingStart,
    emitDrawingStop,
  };
};
