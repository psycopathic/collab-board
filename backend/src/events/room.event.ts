import { Socket } from "socket.io";

import { SOCKET_EVENTS } from "../constants/socket-events.js";
import { boardService } from "../services/board.services.js";
import { presenceService } from "../services/presence.service.js";
import type {
  JoinBoardPayload,
  PresenceUpdatePayload,
  RoomCreateAck,
  RoomEndedPayload,
} from "../types/socket.js";
import { generateRoomId } from "../utils/roomId.js";

export const registerRoomEvents = (socket: Socket) => {
  socket.on(SOCKET_EVENTS.ROOM_CREATE, (ack: (response: RoomCreateAck) => void) => {
    if (typeof ack !== "function") {
      socket.emit(SOCKET_EVENTS.BOARD_ERROR, {
        message: "Missing ack callback for room:create.",
      });
      return;
    }

    const roomId = generateRoomId();
    ack({ roomId });
    console.log(`Room created: ${roomId} by ${socket.id}`);
  });

  socket.on(SOCKET_EVENTS.BOARD_JOIN, ({ boardId, name }: JoinBoardPayload) => {
    if (!boardId || boardId.trim() === "") {
      socket.emit(SOCKET_EVENTS.BOARD_ERROR, {
        message: "Invalid board ID.",
      });

      return;
    }

    const displayName = name?.trim() || `User-${socket.id.slice(0, 4)}`;
    const joinResult = presenceService.joinBoard(socket.id, boardId, displayName);

    if (joinResult.previousBoardId && joinResult.previousBoardId !== boardId) {
      socket.leave(joinResult.previousBoardId);

      const previousPayload: PresenceUpdatePayload = {
        boardId: joinResult.previousBoardId,
        users: joinResult.previousUsers ?? [],
      };

      socket.nsp.to(joinResult.previousBoardId).emit(SOCKET_EVENTS.PRESENCE_UPDATE, previousPayload);
      if (joinResult.previousUser) {
        socket.nsp.to(joinResult.previousBoardId).emit(SOCKET_EVENTS.USER_PRESENCE_LEFT, joinResult.previousUser);
      }
      socket.nsp.to(joinResult.previousBoardId).emit(SOCKET_EVENTS.USER_LEFT, {
        socketId: joinResult.user.socketId,
      });
    }

    socket.join(boardId);

    console.log(`${socket.id} joined ${boardId} as ${displayName}`);

    const hostSocketId = presenceService.getHost(boardId) ?? socket.id;

    socket.emit(SOCKET_EVENTS.BOARD_JOINED, {
      boardId,
      shapes: boardService.getBoard(boardId),
      isHost: presenceService.isHost(socket.id, boardId),
      hostSocketId,
    });

    const presencePayload: PresenceUpdatePayload = {
      boardId,
      users: joinResult.users,
    };

    socket.nsp.to(boardId).emit(SOCKET_EVENTS.PRESENCE_UPDATE, presencePayload);
    socket.to(boardId).emit(SOCKET_EVENTS.USER_PRESENCE_JOINED, joinResult.user);
    socket.to(boardId).emit(SOCKET_EVENTS.USER_JOINED, {
      socketId: socket.id,
    });
  });

  socket.on(SOCKET_EVENTS.ROOM_END, ({ boardId }: { boardId: string }) => {
    if (!boardId || boardId.trim() === "") {
      socket.emit(SOCKET_EVENTS.BOARD_ERROR, {
        message: "Invalid board ID.",
      });
      return;
    }

    if (!presenceService.isHost(socket.id, boardId)) {
      socket.emit(SOCKET_EVENTS.BOARD_ERROR, {
        message: "Only the host can end the room.",
      });
      return;
    }

    const payload: RoomEndedPayload = {
      boardId,
      bySocketId: socket.id,
    };

    socket.nsp.to(boardId).emit(SOCKET_EVENTS.ROOM_ENDED, payload);

    presenceService.endBoard(boardId);
    boardService.deleteBoard(boardId);

    console.log(`Room ended: ${boardId} by ${socket.id}`);

    socket.nsp.in(boardId).socketsLeave(boardId);
    socket.nsp.in(boardId).disconnectSockets(true);
  });
};