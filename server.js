const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// API: serve menu from external JSON file
app.get('/api/menu', (req, res) => {
  const menuPath = path.join(__dirname, 'data', 'menu.json');
  fs.readFile(menuPath, 'utf8', (err, data) => {
    if (err) {
      console.error('Menu file read error:', err);
      return res.status(500).json({ error: 'Could not load menu' });
    }
    try {
      const menu = JSON.parse(data);
      res.json(menu);
    } catch (e) {
      console.error('Menu JSON parse error:', e);
      res.status(500).json({ error: 'Invalid menu data' });
    }
  });
});

// Page routes first (so /, /menu, /about, /contact use new theme, not public/index.html)
app.use(require('./routes/index.js'));
app.use('/menu', require('./routes/menu.js'));
app.use('/about', require('./routes/about.js'));
app.use(require('./routes/contact.js'));
app.use('/reservation', require('./routes/reservation.js'));
app.use('/order', require('./routes/order.js'));

// Static files (assets, favicon, etc.) – after routes so they don’t override pages
app.use(express.static('public'));

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});


