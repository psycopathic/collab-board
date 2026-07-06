import { PresenceUser } from "../types/socket.js";

interface JoinBoardResult {
  user: PresenceUser;
  users: PresenceUser[];
  previousUser?: PresenceUser;
  previousBoardId?: string;
  previousUsers?: PresenceUser[];
}

interface RemoveUserResult {
  user?: PresenceUser;
  users: PresenceUser[];
}

class PresenceService {
  private boards = new Map<string, Map<string, PresenceUser>>();
  private userBySocket = new Map<string, PresenceUser>();

  joinBoard(socketId: string, boardId: string, name: string): JoinBoardResult {
    const previousUser = this.userBySocket.get(socketId);

    if (previousUser) {
      this.removeSocket(socketId);
    }

    const user: PresenceUser = {
      socketId,
      name,
      boardId,
    };

    const boardUsers = this.boards.get(boardId) ?? new Map<string, PresenceUser>();
    boardUsers.set(socketId, user);
    this.boards.set(boardId, boardUsers);
    this.userBySocket.set(socketId, user);

    const result: JoinBoardResult = {
      user,
      users: Array.from(boardUsers.values()),
    };

    if (previousUser) {
      result.previousUser = previousUser;
      result.previousBoardId = previousUser.boardId;
      result.previousUsers = this.getUsers(previousUser.boardId);
    }

    return result;
  }

  removeSocket(socketId: string): RemoveUserResult {
    const user = this.userBySocket.get(socketId);

    if (!user) {
      return { users: [] };
    }

    const boardUsers = this.boards.get(user.boardId);
    boardUsers?.delete(socketId);

    if (boardUsers && boardUsers.size === 0) {
      this.boards.delete(user.boardId);
    }

    this.userBySocket.delete(socketId);

    return {
      user,
      users: this.getUsers(user.boardId),
    };
  }

  getUser(socketId: string): PresenceUser | undefined {
    return this.userBySocket.get(socketId);
  }

  getUsers(boardId: string): PresenceUser[] {
    return Array.from(this.boards.get(boardId)?.values() ?? []);
  }
}

export const presenceService = new PresenceService();
