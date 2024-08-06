const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('universityCourses.db');

const universityCourses = {
  'Hochschule Darmstadt Informatik SPO 2014': [
    { name: 'Einführung in die Wirtschaftsinformatik', ects: '5' },
    { name: 'Grundlagen der diskreten Mathematik', ects: '5' },
    { name: 'IT-Sicherheit', ects: '5' },
    { name: 'Programmieren / Algorithmen und Datenstrukturen 1', ects: '7.5' },
    { name: 'Technische Grundlagen der Informatik', ects: '5' },
    { name: 'IT-Recht und Datenschutz', ects: '2.5' },
    { name: 'Lineare Algebra und Wahrscheinlichkeitsrechnung', ects: '5' },
    { name: 'Netzwerke', ects: '5' },
    { name: 'Objektorientierte Analyse und Design', ects: '5' },
    { name: 'Programmieren / Algorithmen und Datenstrukturen 2', ects: '7.5' },
    { name: 'Rechnerarchitektur', ects: '5' },
    { name: 'Betriebssysteme', ects: '5' },
    { name: 'Datenbanken 1', ects: '5' },
    { name: 'Grundlagen der Analysis', ects: '2.5' },
    { name: 'Mikroprozessorsysteme', ects: '5' },
    { name: 'Nutzerzentrierte Softwareentwicklung', ects: '5' },
    { name: 'Software Engineering', ects: '5' },
    { name: 'Wissenschaftliches Arbeiten in der Informatik 1', ects: '2.5' },
    { name: 'Datenbanken 2', ects: '2.5' },
    { name: 'Entwicklung webbasierter Anwendungen', ects: '5' },
    { name: 'Graphische Datenverarbeitung', ects: '5' },
    { name: 'Informatik und Gesellschaft', ects: '2.5' },
    { name: 'Projektmanagement', ects: '2.5' },
    { name: 'Theoretische Informatik', ects: '7.5' },
    { name: 'Verteilte Systeme', ects: '5' },
    { name: 'Projekt Systementwicklung', ects: '7.5' },
    { name: 'Wissenschaftliches Arbeiten in der Informatik 2', ects: '2.5' },
    { name: 'Praxismodul', ects: '15' },
    { name: 'Bachelormodul', ects: '15' },
    { name: 'Technikfolgenabschätzung in der Produktentwicklung', ects: '2.5' },
    { name: 'Penetration Testing', ects: '5' },
    { name: 'Introduction to Artificial Intelligence', ects: '5' },
    { name: 'Softwareentwicklung für HMI-Systeme', ects: '5' },
    { name: 'Netzwerksicherheit', ects: '5' },
    { name: 'Unix for Software Developers', ects: '5' },
    { name: 'Data Warehouse Technologien', ects: '5' },
  ]
};

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS universities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS courses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    university_id INTEGER,
    name TEXT NOT NULL,
    ects TEXT,
    FOREIGN KEY (university_id) REFERENCES universities(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS session (
    id TEXT PRIMARY KEY
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS sessioncourse (
    session_id TEXT, 
    course_id INTEGER,
    grade REAL default 0.0,
    FOREIGN KEY (session_id) REFERENCES sessions(id),
    FOREIGN KEY (course_id) REFERENCES courses(id)
  )`);

  const insertUniversity = `INSERT OR IGNORE INTO universities (name) VALUES (?)`;
  const insertCourse = `INSERT INTO courses (university_id, name, ects) VALUES (?, ?, ?)`;

  const universityPromises = Object.entries(universityCourses).map(([university, courses]) =>
    new Promise((resolve, reject) => {
      db.run(insertUniversity, [university], function(err) {
        if (err) {
          reject(err);
        } else {
          const universityId = this.lastID;
          const coursePromises = courses.map(course =>
            new Promise((courseResolve, courseReject) => {
              db.run(insertCourse, [universityId, course.name, course.ects], function(courseErr) {
                if (courseErr) {
                  courseReject(courseErr);
                } else {
                  courseResolve();
                }
              });
            })
          );

          Promise.all(coursePromises)
            .then(() => resolve())
            .catch(reject);
        }
      });
    })
  );

  Promise.all(universityPromises).then(() => {
    console.log('All universities and courses have been inserted.');
    db.close(err => {
      if (err) {
        console.error(err.message);
      } else {
        console.log('Database connection closed successfully.');
      }
    });
  }).catch(err => {
    console.error('An error occurred:', err);
  });
});