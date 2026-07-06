import "./Presence.css";

import type { PresenceUser } from "../../types/collaboration";

interface PresenceProps {
  users: PresenceUser[];
  boardId: string;
}

const Presence = ({ users, boardId }: PresenceProps) => {
  return (
    <aside className="presence-panel">
      <div className="presence-panel__header">
        <span className="presence-panel__title">Online ({users.length})</span>
        <span className="presence-panel__board">{boardId}</span>
      </div>

      <ul className="presence-panel__list">
        {users.map((user) => (
          <li className="presence-panel__item" key={user.socketId}>
            <span className="presence-panel__dot" />
            <span>{user.name}</span>
          </li>
        ))}
      </ul>
    </aside>
  );
};

export default Presence;
