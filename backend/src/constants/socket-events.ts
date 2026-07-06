export const SOCKET_EVENTS = {
  CONNECTION: "connection",
  DISCONNECT: "disconnect",

  BOARD_JOIN: "board:join",
  BOARD_JOINED: "board:joined",

  BOARD_LEAVE: "board:leave",

  BOARD_DRAW: "board:draw",

  BOARD_CLEAR: "board:clear",

  BOARD_ERROR: "board:error",

  USER_JOINED: "board:user-joined",

  USER_LEFT: "board:user-left",
} as const;