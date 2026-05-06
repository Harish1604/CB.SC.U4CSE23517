const { getDb, closeDb } = require('../db/init');

function seed() {
  const db = getDb();
  console.log('seeding database...');

  db.exec('DELETE FROM notifications');
  db.exec('DELETE FROM students');
  db.exec("DELETE FROM sqlite_sequence WHERE name='students'");
  db.exec("DELETE FROM sqlite_sequence WHERE name='notifications'");

  const addStudent = db.prepare('INSERT INTO students (name, email, department) VALUES (?, ?, ?)');
  const students = [
    ['Harish Kumar', 'harish@campus.edu', 'Computer Science'],
    ['Priya Sharma', 'priya@campus.edu', 'Information Technology'],
    ['Rahul Menon', 'rahul@campus.edu', 'Electronics'],
    ['Ananya Reddy', 'ananya@campus.edu', 'Computer Science'],
    ['Vikram Singh', 'vikram@campus.edu', 'Mechanical'],
  ];

  db.transaction(() => {
    for (const s of students) addStudent.run(s[0], s[1], s[2]);
  })();
  console.log(`  added ${students.length} students`);

  const addNotif = db.prepare(
    'INSERT INTO notifications (student_id, type, message, priority, is_read, created_at) VALUES (?, ?, ?, ?, ?, ?)'
  );

  const now = new Date();
  const ago = (hours) => new Date(now - hours * 3600000).toISOString();

  const notifs = [
    [1, 'Placement', 'TCS visiting campus May 15th. Register before May 10th.', 1, 0, ago(2)],
    [1, 'Placement', 'Infosys pool drive scheduled for May 20th.', 1, 0, ago(8)],
    [1, 'Result', 'Semester 6 results published. Check portal.', 2, 0, ago(5)],
    [1, 'Event', 'Hackathon registrations open, deadline May 12th.', 3, 0, ago(1)],
    [1, 'Event', 'Annual tech fest Technozia starts May 18th.', 3, 0, ago(48)],
    [1, 'Result', 'Internal assessment marks for DSA uploaded.', 2, 1, ago(120)],
    [1, 'Placement', 'Wipro pre-placement talk May 8th, Auditorium B.', 1, 1, ago(72)],
    [1, 'Event', 'Workshop on cloud computing — free registration.', 3, 1, ago(168)],
    [1, 'Placement', 'Amazon SDE intern shortlist announced.', 1, 0, ago(30)],
    [1, 'Result', 'Lab exam results for DBMS posted.', 2, 0, ago(24)],
    [2, 'Placement', 'Cognizant GenC Next — apply by May 9th.', 1, 0, ago(3)],
    [2, 'Result', 'Semester 6 results published.', 2, 0, ago(5)],
    [2, 'Event', 'Women in Tech meetup — May 14th.', 3, 0, ago(12)],
    [2, 'Placement', 'Zoho off-campus drive link shared.', 1, 0, ago(24)],
    [2, 'Event', 'IEEE paper submission deadline extended.', 3, 1, ago(96)],
    [3, 'Result', 'Backlog exam results declared.', 2, 0, ago(6)],
    [3, 'Placement', 'L&T Infotech walk-in on May 12th.', 1, 0, ago(10)],
    [3, 'Event', 'Sports day May 16th. Register your team.', 3, 0, ago(48)],
    [3, 'Placement', 'Accenture aptitude test rescheduled to May 11th.', 1, 0, ago(24)],
    [4, 'Placement', 'Microsoft internship apps close May 7th.', 1, 0, ago(1)],
    [4, 'Result', 'Mini project evaluation grades released.', 2, 0, ago(4)],
    [4, 'Event', 'AI/ML workshop by Google Developer Group.', 3, 0, ago(24)],
    [4, 'Placement', 'Google STEP intern results — check email.', 1, 0, ago(72)],
    [4, 'Result', 'Semester 5 supplementary results out.', 2, 1, ago(240)],
    [5, 'Event', 'Mechanical dept visit to Tata Motors May 22nd.', 3, 0, ago(7)],
    [5, 'Placement', 'Bosch campus recruitment — May 19th.', 1, 0, ago(24)],
    [5, 'Result', 'CAD lab practical marks uploaded.', 2, 0, ago(48)],
    [5, 'Event', 'Guest lecture on electric vehicles May 13th.', 3, 1, ago(144)],
  ];

  db.transaction(() => {
    for (const n of notifs) addNotif.run(n[0], n[1], n[2], n[3], n[4], n[5]);
  })();
  console.log(`  added ${notifs.length} notifications`);
  console.log('seed complete.');
  closeDb();
}

seed();
