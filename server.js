const express = require('express');
const mysql = require('mysql2');
const path = require('path');

const app = express();
//const port = 3001;

 require('dotenv').config()

 const apiKey=process.env.KEY;
 const port=process.env.PORT || 3001;


// Serve static files from the main folder
app.use(express.static(path.join(__dirname, '')));
app.use(express.json()); // Parse JSON in the request body

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'sarvagya26',
    database: 'route'
});

const createLocationsTableQuery = `
    CREATE TABLE IF NOT EXISTS locations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        address VARCHAR(255),
        lat DOUBLE NOT NULL,
        lng DOUBLE NOT NULL,
        visited BOOLEAN NOT NULL DEFAULT false
    )
`;
connection.query(createLocationsTableQuery, (err) => {
    if (err) {
        console.error('Error creating locations table:', err.message);
    } else {
        console.log('Locations table created or already exists.');
    }
});

app.post('/saveLocation', (req, res) => {
    const { address, location, visited } = req.body;

    const insertQuery = 'INSERT INTO locations (address, lat, lng, visited) VALUES (?, ?, ?, ?)';

    connection.query(insertQuery, [address, location.lat, location.lng, visited], (err, results) => {
        if (err) {
            console.error('Error saving location to the database:', err.message);
            res.status(500).json({ error: 'Error saving location to the database' });
        } else {
            console.log(`Location ${address} saved to the database. Inserted ID: ${results.insertId}`);
            
           
    

            res.json({ message: 'Location saved successfully' });
        }
    });
});

app.post('/updateVisited', (req, res) => {
    const { address, location, visited } = req.body;

    const updateQuery = 'UPDATE locations SET visited = ? WHERE address = ?';


    if (visited !== undefined) {
        connection.query(updateQuery, [visited, address], (updateErr) => {
            if (updateErr) {
                console.error('Error updating completion status:', updateErr.message);
            } else {
                console.log(`Completion status updated for location ${address}.`);
            }
        });
    }
    
});

app.get('/', (req, res) => {
    // Send the 'index.html' file as the response
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});


// Endpoint to get API key
app.get('/get-api-key', (req, res) => {
  res.send({ apiKey });
});



