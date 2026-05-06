import NotificationCard from './NotificationCard';
import './PriorityInbox.css';

function PriorityInbox({ notifications, onMarkRead }) {
  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="priority-inbox">
      <h2 className="priority-title">Priority Inbox</h2>
      <p className="priority-subtitle">Top notifications ranked by importance</p>
      <div className="priority-list">
        {notifications.map((n) => (
          <NotificationCard key={n.id} notification={n} onMarkRead={onMarkRead} />
        ))}
      </div>
    </div>
  );
}

export default PriorityInbox;
