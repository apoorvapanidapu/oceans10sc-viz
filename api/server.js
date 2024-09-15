const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Replace with your MongoDB Atlas connection string
const dbURI = 'mongodb+srv://apoorvapanidapu:Oceans1234!@oceans10sc-cluster.urfzm.mongodb.net/oceans10sc/?retryWrites=true&w=majority';

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
