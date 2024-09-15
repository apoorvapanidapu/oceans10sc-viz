const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');  // Import CORS middleware
const mongoose = require('mongoose');

const app = express();

app.use(cors());  // Enable CORS for all routes
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Replace with your MongoDB Atlas connection string
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
app.post('/markers', async (req, res) => {
  try {
    const marker = new Marker(req.body);
    await marker.save();
    res.status(201).send(marker);
  } catch (error) {
    console.error('Error adding marker:', error);
    res.status(500).send('Server error while adding marker.');
  }
});

app.get('/markers', async (req, res) => {
  try {
    const markers = await Marker.find();
    res.send(markers);
  } catch (error) {
    console.error('Error fetching markers:', error);
    res.status(500).send('Server error while fetching markers.');
  }
});

app.delete('/markers/:id', async (req, res) => {
  try {
    await Marker.findByIdAndDelete(req.params.id);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting marker:', error);
    res.status(500).send('Server error while deleting marker.');
  }
});

// Remove this part for Vercel (no need to listen to a port)
// app.listen(port, () => {
//   console.log(`Server running on http://localhost:${port}`);
// });

// Export the Express app for Vercel
module.exports = app;
