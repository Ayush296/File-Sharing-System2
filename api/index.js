require('dotenv').config();
const express = require('express');
const multer = require('multer');
const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Supabase Setup
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

let supabase;
if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
} else {
  console.warn("WARNING: Missing SUPABASE_URL or SUPABASE_KEY in environment variables.");
}

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Configure Multer for memory storage (crucial for serverless Vercel)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// --- APIs ---

// 1. Upload File
app.post('/api/upload', upload.single('file'), async (req, res) => {
  if (!supabase) return res.status(500).json({ error: 'Server database is not configured. Missing Supabase variables.' });
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const id = uuidv4();
  const pin = req.body.pin && req.body.pin.trim() !== '' ? req.body.pin : null;
  const originalName = req.file.originalname;
  // Create a clean storage name to prevent S3 key issues
  const storageName = `${id}-${originalName.replace(/[^a-zA-Z0-9.\-_]/g, '')}`;

  // 1a. Upload to Supabase Storage Bucket ('uploads')
  const { data: uploadData, error: uploadError } = await supabase
    .storage
    .from('uploads')
    .upload(storageName, req.file.buffer, {
      contentType: req.file.mimetype,
      upsert: false
    });

  if (uploadError) {
    console.error('Upload Error:', uploadError);
    return res.status(500).json({ error: 'Failed to upload file to cloud storage.' });
  }

  // 1b. Insert metadata to Database ('files' table)
  const { error: dbError } = await supabase
    .from('files')
    .insert([{ id, original_name: originalName, storage_name: storageName, pin }]);

  if (dbError) {
    console.error('DB Error:', dbError);
    // Rollback storage upload conceptually, but ignoring for simplicity
    return res.status(500).json({ error: 'Failed to save metadata to database.' });
  }

  const link = `${req.protocol}://${req.get('host')}/download.html?id=${id}`;
  res.json({ id, link, originalName, hasPin: !!pin });
});

// 2. Get File Info
app.get('/api/file/:id/info', async (req, res) => {
  if (!supabase) return res.status(500).json({ error: 'Database not configured.' });
  const { id } = req.params;

  const { data, error } = await supabase
    .from('files')
    .select('original_name, pin')
    .eq('id', id)
    .single();

  if (error || !data) return res.status(404).json({ error: 'File not found' });

  res.json({
    id,
    originalName: data.original_name,
    hasPin: !!data.pin
  });
});

// 3. Download File (Proxy via backend)
app.post('/api/file/:id/download', async (req, res) => {
  if (!supabase) return res.status(500).json({ error: 'Database not configured.' });
  const { id } = req.params;
  const providedPin = req.body.pin;

  // 3a. Validate PIN and get storage name
  const { data, error } = await supabase
    .from('files')
    .select('original_name, storage_name, pin')
    .eq('id', id)
    .single();

  if (error || !data) return res.status(404).json({ error: 'File not found' });

  if (data.pin && data.pin !== providedPin) {
    return res.status(401).json({ error: 'Invalid PIN' });
  }

  // 3b. Download file buffer from Supabase Storage and stream to client
  const { data: fileData, error: fileError } = await supabase
    .storage
    .from('uploads')
    .download(data.storage_name);

  if (fileError) {
    console.error('Storage Download Error:', fileError);
    return res.status(404).json({ error: 'File has been deleted from server.' });
  }

  // Convert Blob to Buffer and send back
  const arrayBuffer = await fileData.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  res.setHeader('Content-Disposition', `attachment; filename="${data.original_name}"`);
  res.setHeader('Content-Type', fileData.type || 'application/octet-stream');
  res.send(buffer);
});

// Export the Express API (required by Vercel)
module.exports = app;

// Allow running locally via node
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}
