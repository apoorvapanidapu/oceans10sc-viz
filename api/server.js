const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

const app = express();

app.use(cors());
app.use(express.json());

// Configure AWS
const s3Client = new S3Client({
  region: "us-west-1",  // Hardcode this to match your bucket's region
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  }
});

const getPublicUrl = (bucket, key) => `https://${bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

// Configure multer for memory storage
const upload = multer({ storage: multer.memoryStorage() });

require('dotenv').config();

// MongoDB connection (make sure you're using the updated connection string)
const dbURI = process.env.MONGODB_URI;
mongoose.connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB Atlas'))
  .catch((err) => console.error('MongoDB connection error:', err));


// Updated Marker Schema
const markerSchema = new mongoose.Schema({
  lat: Number,
  lng: Number,
  startTime: String,
  endTime: String,
  depth: Number,
  activity: String,
  otherActivity: String,
  notes: String,
  media: [String],
  fileLink: String,
  label: String
});
const Marker = mongoose.model('Marker', markerSchema);

app.post('/api/markers', upload.array('media', 5), async (req, res) => {
  try {
    console.log('Received marker data:', req.body);
    console.log('Received files:', req.files);

    const mediaUrls = await Promise.all(req.files.map(async (file) => {
      const key = `uploads/${Date.now()}-${file.originalname}`;
      const params = {
        Bucket: process.env.S3_BUCKET_NAME,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype
      };
      
      console.log('S3 upload params:', JSON.stringify(params, null, 2));

      try {
        const command = new PutObjectCommand(params);
        const response = await s3Client.send(command);
        console.log('S3 upload response:', JSON.stringify(response, null, 2));
        
        return getPublicUrl(process.env.S3_BUCKET_NAME, key);
      } catch (uploadError) {
        console.error('S3 upload error:', uploadError);
        throw new Error(`S3 upload failed: ${uploadError.message}`);
      }
    }));

    const markerData = {
      ...req.body,
      lat: parseFloat(req.body.lat),
      lng: parseFloat(req.body.lng),
      depth: req.body.depth && req.body.depth !== '' ? parseFloat(req.body.depth) : undefined,
      media: mediaUrls,
      label: req.body.label || req.body.activity
    };

    console.log('Processed marker data:', markerData);

    const marker = new Marker(markerData);
    const savedMarker = await marker.save();
    console.log('Marker saved successfully:', savedMarker);
    res.status(201).json(savedMarker);
  } catch (error) {
    console.error('Detailed error adding marker:', error);
    res.status(500).json({ error: 'Server error while adding marker.', details: error.message });
  }
});

app.get('/api/markers', async (req, res) => {
  try {
    console.log('Fetching markers from database...');
    const markers = await Marker.find();
    console.log('Markers fetched:', markers.map(m => ({ id: m._id, lat: m.lat, lng: m.lng })));
    res.json(markers);
  } catch (error) {
    console.error('Error fetching markers:', error);
    res.status(500).json({ error: 'Server error while fetching markers.', details: error.message });
  }
});

app.delete('/api/markers/:id', async (req, res) => {
  console.log('Delete request received for marker ID:', req.params.id);
  try {
    const result = await Marker.findByIdAndDelete(req.params.id);
    console.log('Delete operation result:', result);
    if (result) {
      console.log('Marker deleted:', req.params.id);
      res.status(204).send();
    } else {
      console.log('Marker not found:', req.params.id);
      res.status(404).json({ error: 'Marker not found.' });
    }
  } catch (error) {
    console.error('Error deleting marker:', error);
    res.status(500).json({ error: 'Server error while deleting marker.', details: error.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.stack);
  res.status(500).json({ error: 'Something went wrong!', details: err.message });
});

// Serve static files
app.use(express.static('public'));

// Export the Express API
module.exports = app;