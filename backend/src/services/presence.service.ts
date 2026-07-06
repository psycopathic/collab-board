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
  newHost?: PresenceUser;
}

interface EndBoardResult {
  socketIds: string[];
}

class PresenceService {
  private boards = new Map<string, Map<string, PresenceUser>>();
  private userBySocket = new Map<string, PresenceUser>();
  private hosts = new Map<string, string>();

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

    if (!this.hosts.has(boardId)) {
      this.hosts.set(boardId, socketId);
    }

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

    let newHost: PresenceUser | undefined;

    if (boardUsers && boardUsers.size === 0) {
      this.boards.delete(user.boardId);
      this.hosts.delete(user.boardId);
    } else if (boardUsers) {
      const wasHost = this.hosts.get(user.boardId) === socketId;

      if (wasHost) {
        const nextSocketId = boardUsers.keys().next().value;

        if (nextSocketId) {
          this.hosts.set(user.boardId, nextSocketId);
          newHost = boardUsers.get(nextSocketId);
        }
      }
    }

    this.userBySocket.delete(socketId);

    const result: RemoveUserResult = {
      user,
      users: this.getUsers(user.boardId),
    };

    if (newHost) {
      result.newHost = newHost;
    }

    return result;
  }

  endBoard(boardId: string): EndBoardResult {
    const boardUsers = this.boards.get(boardId);
    const socketIds = boardUsers ? Array.from(boardUsers.keys()) : [];

    for (const socketId of socketIds) {
      this.userBySocket.delete(socketId);
    }

    this.boards.delete(boardId);
    this.hosts.delete(boardId);

    return { socketIds };
  }

  getHost(boardId: string): string | undefined {
    return this.hosts.get(boardId);
  }

  isHost(socketId: string, boardId: string): boolean {
    return this.getHost(boardId) === socketId;
  }

  getUser(socketId: string): PresenceUser | undefined {
    return this.userBySocket.get(socketId);
  }

  getUsers(boardId: string): PresenceUser[] {
    return Array.from(this.boards.get(boardId)?.values() ?? []);
  }
}

export const presenceService = new PresenceService();
