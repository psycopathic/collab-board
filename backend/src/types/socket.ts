export interface JoinBoardPayload {
  boardId: string;
  name?: string;
}

export interface ClearBoardPayload {
  boardId: string;
}

export interface PresenceUser {
  socketId: string;
  name: string;
  boardId: string;
}

export interface PresenceUpdatePayload {
  boardId: string;
  users: PresenceUser[];
}

export interface CursorMovePayload {
  boardId: string;
  x: number;
  y: number;
}

export interface CursorUpdatePayload extends CursorMovePayload, PresenceUser {}

export interface DrawingStatusPayload {
  boardId: string;
}

export interface DrawingUpdatePayload extends PresenceUser {
  isDrawing: boolean;
}
