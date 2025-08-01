// routes/messages.js
const express = require('express');
const router = express.Router();

// Example GET route
router.get('/', (req, res) => {
  res.json({ message: "Messages route working!" });
});

module.exports = router;
