import { Socket } from "socket.io";
import { joinBoardPayload } from "../types/socket.js";

export const registerRoomEvents = (socket: Socket) => {
  socket.on("board:join", ({ boardId }: joinBoardPayload) => {
    socket.join(boardId);

    console.log(`${socket.id} joined ${boardId}`);

    socket.emit("board:joined", {
      boardId,
    });

    socket.to(boardId).emit("board:user-joined", {
      socketId: socket.id,
    });
  });
};