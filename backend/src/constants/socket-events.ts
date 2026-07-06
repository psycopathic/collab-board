export const SOCKET_EVENTS = {
  CONNECTION: "connection",
  DISCONNECT: "disconnect",

  BOARD_JOIN: "board:join",
  BOARD_JOINED: "board:joined",

  BOARD_LEAVE: "board:leave",

  ROOM_CREATE: "room:create",
  ROOM_END: "room:end",
  ROOM_ENDED: "room:ended",
  HOST_CHANGED: "host:changed",

  BOARD_DRAW: "board:draw",

  BOARD_CLEAR: "board:clear",

  BOARD_ERROR: "board:error",

  USER_JOINED: "board:user-joined",

  USER_LEFT: "board:user-left",

  CURSOR_MOVE: "cursor:move",
  CURSOR_UPDATE: "cursor:update",

  DRAWING_START: "drawing:start",
  DRAWING_STOP: "drawing:stop",
  DRAWING_UPDATE: "drawing:update",

  PRESENCE_UPDATE: "presence:update",
  USER_PRESENCE_JOINED: "user:joined",
  USER_PRESENCE_LEFT: "user:left",

  SHAPE_CREATE: "shape:create",
  SHAPE_UPDATE: "shape:update",
  SHAPE_DELETE: "shape:delete",
} as const;
