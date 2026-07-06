import "./Notification.css";

import type { UserNotification } from "../../types/collaboration";

interface NotificationProps {
  notifications: UserNotification[];
}

const Notification = ({ notifications }: NotificationProps) => {
  return (
    <div className="notifications" aria-live="polite">
      {notifications.map((notification) => (
        <div className="notifications__item" key={notification.id}>
          {notification.message}
        </div>
      ))}
    </div>
  );
};

export default Notification;
