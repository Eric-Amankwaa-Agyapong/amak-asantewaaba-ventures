const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const uploadDir = path.join(__dirname, 'public', 'uploads');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, uploadDir),
  filename: (_, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${Date.now()}-${safe}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_, file, cb) => {
    const allowed = /^(image\/(jpeg|png|gif|webp)|application\/pdf|text\/plain|application\/zip|application\/msword|application\/vnd.openxmlformats-officedocument.wordprocessingml.document|application\/vnd.ms-excel|application\/vnd.openxmlformats-officedocument.spreadsheetml.sheet)$/;
    cb(null, allowed.test(file.mimetype));
  }
});

app.use(express.static(path.join(__dirname, 'public')));
app.get('/api/files', (_, res) => {
  const files = fs.readdirSync(uploadDir).map(name => {
    const stat = fs.statSync(path.join(uploadDir, name));
    return { name, size: stat.size, uploadedAt: stat.mtime.toISOString(), url: `/uploads/${encodeURIComponent(name)}` };
  }).sort((a,b) => b.uploadedAt.localeCompare(a.uploadedAt));
  res.json(files);
});
app.post('/api/upload', upload.array('files', 20), (req, res) => {
  res.json({ ok: true, files: req.files.map(f => ({ name: f.originalname, storedName: f.filename, size: f.size, url: `/uploads/${encodeURIComponent(f.filename)}` })) });
});
app.delete('/api/files/:name', (req,res) => {
  const name = path.basename(req.params.name);
  const file = path.join(uploadDir, name);
  if (!fs.existsSync(file)) return res.status(404).json({error:'File not found'});
  fs.unlinkSync(file); res.json({ok:true});
});
app.listen(PORT, () => console.log(`Amak Asantewaaba Ventures running at http://localhost:${PORT}`));
