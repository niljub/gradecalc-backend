const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const cors = require('cors'); // Import CORS module
const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(cors()); // Enable CORS for all routes

// Endpoint to retrieve courses by university
app.get('/api/courses/:university', (req, res) => {
    const db = new sqlite3.Database('universityCourses.db');
    const university = req.params.university;
    db.serialize(() => {
        db.get(`SELECT id FROM universities WHERE name = ?`, [university], (err, row) => {
            if (err) {
                return res.status(500).send('Database error');
            }

            if (!row) {
                return res.status(404).send('University not found');
            }

            const universityId = row.id;

            db.all('SELECT * FROM courses WHERE university_id = ?', [universityId], (err, rows) => {
                if (err) {
                    return res.status(500).send('Database error');
                }
                res.status(200).json(rows);
            });

            db.close();
        });
    });
});

// Endpoint to retrieve all universities
app.get('/api/universities', (req, res) => {
    const db = new sqlite3.Database('universityCourses.db');

    db.all('SELECT * FROM universities', (err, rows) => {
        if (err) {
            return res.status(500).send('Database error');
        }
        res.status(200).json(rows);
    });

    db.close();
});

// Endpoint to retrieve all courses
app.get('/api/courses', (req, res) => {
    const db = new sqlite3.Database('universityCourses.db');

    db.all('SELECT * FROM courses', (err, rows) => {
        if (err) {
            return res.status(500).send('Database error');
        }
        res.status(200).json(rows);
    });

    db.close();
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
