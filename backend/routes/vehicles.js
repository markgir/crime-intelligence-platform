// vehicle endpoints

const express = require('express');
const router = express.Router();

// Get all vehicles
router.get('/', (req, res) => {
    res.send('List of all vehicles');
});

// Get a vehicle by ID
router.get('/:id', (req, res) => {
    res.send(`Vehicle with ID: ${req.params.id}`);
});

// Create a new vehicle
router.post('/', (req, res) => {
    res.send('Vehicle created');
});

// Update a vehicle by ID
router.put('/:id', (req, res) => {
    res.send(`Vehicle with ID: ${req.params.id} updated`);
});

// Delete a vehicle by ID
router.delete('/:id', (req, res) => {
    res.send(`Vehicle with ID: ${req.params.id} deleted`);
});

module.exports = router;