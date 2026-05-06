import NotificationCard from './NotificationCard';

function NotificationList({ notifications, onMarkRead }) {
  if (notifications.length === 0) {
    return <p className="empty-msg">No notifications to show.</p>;
  }

  return (
    <div className="notif-list">
      {notifications.map((n) => (
        <NotificationCard key={n.id} notification={n} onMarkRead={onMarkRead} />
      ))}
    </div>
  );
}

export default NotificationList;
