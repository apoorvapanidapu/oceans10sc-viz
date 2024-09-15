const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(bodyParser.json());

// Replace with your MongoDB connection string
const dbURI = 'mongodb+srv://apoorvapanidapu:Oceans1234!@oceans10sc-cluster.urfzm.mongodb.net/oceans10sc?retryWrites=true&w=majority';

mongoose.connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB Atlas'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Define Marker Schema and Model
const markerSchema = new mongoose.Schema({
  lat: Number,
  lng: Number
});
const Marker = mongoose.model('Marker', markerSchema);

// API Endpoints
app.post('/api/markers', async (req, res) => {
  try {
    const marker = new Marker(req.body);
    await marker.save();
    res.status(201).json(marker);
  } catch (error) {
    console.error('Error adding marker:', error);
    res.status(500).json({ error: 'Server error while adding marker.' });
  }
});

app.get('/api/markers', async (req, res) => {
  try {
    const markers = await Marker.find();
    res.json(markers);
  } catch (error) {
    console.error('Error fetching markers:', error);
    res.status(500).json({ error: 'Server error while fetching markers.' });
  }
});

app.delete('/api/markers/:id', async (req, res) => {
  try {
    const result = await Marker.findByIdAndDelete(req.params.id);
    if (!result) {
      return res.status(404).json({ error: 'Marker not found' });
    }
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting marker:', error);
    res.status(500).json({ error: 'Server error while deleting marker.' });
  }
});

// Export the Express API
module.exports = app;