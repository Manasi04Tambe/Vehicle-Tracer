const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors')

const app = express();
const PORT = 5000;
app.use(cors());

app.get('/api/vehicle', (req, res) => {
    console.log("Api has been called.")
    fs.readFile(path.join(__dirname, 'vehicle_data.json'), 'utf8', (err, data) => {
        if (err) {
            res.status(500).send('Error reading vehicle data');
            return;
        }
        res.json(JSON.parse(data));
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
