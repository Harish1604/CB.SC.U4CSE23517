import './NotificationCard.css';

function NotificationCard({ notification, onMarkRead }) {
  const typeClass = notification.type.toLowerCase();
  const time = new Date(notification.createdAt).toLocaleString();

  return (
    <div className={`notif-card ${typeClass} ${notification.isRead ? 'read' : 'unread'}`}>
      <div className="notif-header">
        <span className={`notif-badge ${typeClass}`}>{notification.type}</span>
        <span className="notif-time">{time}</span>
      </div>
      <p className="notif-message">{notification.message}</p>
      {!notification.isRead && (
        <button className="mark-read-btn" onClick={() => onMarkRead(notification.id)}>
          Mark as read
        </button>
      )}
    </div>
  );
}

export default NotificationCard;
