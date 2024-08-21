const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(cors());

app.get('/api/courses/:university', (req, res) => {
    const db = new sqlite3.Database('universityCourses.db');
    const university = req.params.university;
    db.serialize(() => {
        db.get(`SELECT id FROM universities WHERE name = ?`, [university], (err, row) => {
            if (err) {
                db.close();
                return res.status(500).send('Database error');
            }

            if (!row) {
                db.close();
                return res.status(404).send('University not found');
            }

            const universityId = row.id;
            db.all('SELECT * FROM courses WHERE university_id = ?', [universityId], (err, rows) => {
                db.close();
                if (err) {
                    return res.status(500).send('Database error');
                }
                res.status(200).json(rows);
            });
        });
    });
});

app.get('/api/universities', (req, res) => {
    const db = new sqlite3.Database('universityCourses.db');
    db.all('SELECT * FROM universities', (err, rows) => {
        db.close();
        if (err) {
            return res.status(500).send('Database error');
        }
        res.status(200).json(rows);
    });
});

app.get('/api/courses', (req, res) => {
    const db = new sqlite3.Database('universityCourses.db');
    db.all('SELECT * FROM courses', (err, rows) => {
        db.close();
        if (err) {
            return res.status(500).send('Database error');
        }
        res.status(200).json(rows);
    });
});

app.post('/api/session/', (req, res) => {
    console.log(req.body);
    const db = new sqlite3.Database('universityCourses.db');
    
    db.serialize(() => {
        db.run('BEGIN TRANSACTION');

        // Insert session
        db.run(`INSERT INTO session (id) VALUES (?)`, [req.body.sessionId], function(err) {
            if (err) {
                console.error('Error inserting session:', err.message);
                db.run('ROLLBACK', () => db.close());
                return res.status(500).send('Error inserting session');
            }

            // Insert courses and session-course relationships
            const courses = req.body.courses;
            const courseInserts = courses.map(course => {
                return new Promise((resolve, reject) => {
                    db.run(`INSERT INTO courses (id, university_id, name, ects) VALUES (?, ?, ?, ?)`,
                        [null, null, course.name, course.ects], function(err) {
                            if (err) {
                                return reject(err);
                            }

                            db.run(`INSERT INTO sessioncourse (session_id, course_id) VALUES (?, ?)`,
                                [req.body.sessionId, course.id], function(err) {
                                    if (err) {
                                        return reject(err);
                                    }
                                    resolve();
                                });
                        });
                });
            });

            Promise.all(courseInserts)
                .then(() => {
                    db.run('COMMIT', err => {
                        db.close();
                        if (err) {
                            console.error('Error committing transaction:', err.message);
                            return res.status(500).send('Error during transaction commit');
                        }
                        res.json({ message: 'Session and courses added successfully' });
                    });
                })
                .catch(err => {
                    console.error('Error inserting courses or linking:', err.message);
                    db.run('ROLLBACK', () => db.close());
                    res.status(500).send('Error inserting courses or linking session and courses');
                });
        });
    });
});

app.get('/api/session/:session', (req, res) => {
    const db = new sqlite3.Database('universityCourses.db');
    const sessionId = req.params.session;

    db.serialize(() => {
        // Check if session exists
        db.get(`SELECT id FROM session WHERE id = ?`, [sessionId], (err, sessionRow) => {
            if (err) {
                db.close();
                return res.status(500).send('Database error while fetching session');
            }

            if (!sessionRow) {
                db.close();
                return res.status(404).send('Session not found');
            }

            // Get all courses linked to this session
            db.all(`SELECT c.* FROM courses c JOIN sessioncourse sc ON c.id = sc.course_id WHERE sc.session_id = ?`, [sessionId], (err, courses) => {
                db.close();
                if (err) {
                    return res.status(500).send('Database error while fetching courses for the session');
                }
                res.status(200).json({ sessionId: sessionId, courses: courses });
            });
        });
    });
});


app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
