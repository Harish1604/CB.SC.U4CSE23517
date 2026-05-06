import { useState, useEffect } from 'react';
import FilterBar from './components/FilterBar';
import NotificationList from './components/NotificationList';
import PriorityInbox from './components/PriorityInbox';
import { fetchNotifications, fetchPriorityNotifications, markAsRead, Log } from './api/notifications';
import './App.css';

function App() {
  const [notifications, setNotifications] = useState([]);
  const [priorityNotifs, setPriorityNotifs] = useState([]);
  const [filter, setFilter] = useState('All');
  const studentId = 1; // hardcoded for demo

  const loadData = async () => {
    try {
      const all = await fetchNotifications({ studentId });
      const priority = await fetchPriorityNotifications(3, studentId);
      setNotifications(all.data || []);
      setPriorityNotifs(priority.data || []);
      Log("info", "page", "Initial data loaded for student " + studentId);
    } catch (err) {
      Log("error", "api", "Failed to load notifications: " + err.message);
    }
  };

  useEffect(() => {
    loadData();

    // SSE for real-time updates
    const eventSource = new EventSource(`/notifications/stream?studentId=${studentId}`);
    
    eventSource.onmessage = (event) => {
      const newNotif = JSON.parse(event.data);
      Log("info", "hook", "New real-time notification received");
      setNotifications(prev => [newNotif, ...prev]);
      // refresh priority inbox on new notif
      fetchPriorityNotifications(3, studentId).then(res => setPriorityNotifs(res.data || []));
    };

    return () => eventSource.close();
  }, []);

  const handleMarkRead = async (id) => {
    try {
      await markAsRead(id);
      Log("info", "component", "Marked notification " + id + " as read");
      // update local state
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setPriorityNotifs(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      Log("error", "component", "Failed to mark as read: " + err.message);
    }
  };

  const filteredNotifs = filter === 'All' 
    ? notifications 
    : notifications.filter(n => n.type === filter);

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Campus Connect</h1>
        <p>Student Notification Portal</p>
      </header>

      <main className="app-main">
        <section className="priority-section">
          <PriorityInbox notifications={priorityNotifs} onMarkRead={handleMarkRead} />
        </section>

        <section className="feed-section">
          <div className="feed-header">
            <h2>Your Feed</h2>
            <FilterBar activeFilter={filter} onFilterChange={setFilter} />
          </div>
          <NotificationList notifications={filteredNotifs} onMarkRead={handleMarkRead} />
        </section>
      </main>
    </div>
  );
}

export default App;
