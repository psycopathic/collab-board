import { Socket } from "socket.io";

import { SOCKET_EVENTS } from "../constants/socket-events.js";
import { boardService } from "../services/board.services.js";
import { ClearBoardPayload } from "../types/socket.js";
export const registerClearEvents = (socket: Socket) => {
  socket.on(
    SOCKET_EVENTS.BOARD_CLEAR,
    ({ boardId }: ClearBoardPayload) => {
      if (!boardId || boardId.trim() === "") {
        socket.emit(SOCKET_EVENTS.BOARD_ERROR, {
          message: "Invalid board ID.",
        });

        return;
      }

      boardService.clearBoard(boardId);

      socket.to(boardId).emit(SOCKET_EVENTS.BOARD_CLEAR);

      console.log(`🧹 Board cleared: ${boardId}`);
    }
  );
};