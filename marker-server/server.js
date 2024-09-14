const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/markers', { useNewUrlParser: true, useUnifiedTopology: true });

// Define Marker Schema and Model
const markerSchema = new mongoose.Schema({
  lat: Number,
  lng: Number
});
const Marker = mongoose.model('Marker', markerSchema);

// API Endpoints
app.post('/markers', async (req, res) => {
  const marker = new Marker(req.body);
  await marker.save();
  res.status(201).send(marker);
});

app.get('/markers', async (req, res) => {
  const markers = await Marker.find();
  res.send(markers);
});

app.delete('/markers/:id', async (req, res) => {
  await Marker.findByIdAndDelete(req.params.id);
  res.status(204).send();
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
