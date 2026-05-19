const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'root1234',
  database: 'dekor_asistanim'
});

db.connect((err) => {
  if (err) console.log('DB Hata:', err);
  else console.log('MySQL bağlantısı başarılı!');
});

// Kayıt ol
app.post('/api/register', async (req, res) => {
  const { ad, email, sifre } = req.body;
  const hash = await bcrypt.hash(sifre, 10);
  db.query('INSERT INTO users (ad, email, sifre) VALUES (?, ?, ?)',
    [ad, email, hash], (err) => {
    if (err) return res.json({ hata: 'Email zaten kayıtlı' });
    res.json({ mesaj: 'Kayıt başarılı' });
  });
});

// Giriş yap
app.post('/api/login', async (req, res) => {
  const { email, sifre } = req.body;
  db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
    if (results.length === 0) return res.json({ hata: 'Kullanıcı bulunamadı' });
    const dogru = await bcrypt.compare(sifre, results[0].sifre);
    if (!dogru) return res.json({ hata: 'Şifre yanlış' });
    const token = jwt.sign({ id: results[0].id }, 'gizli_anahtar');
    res.json({ token, ad: results[0].ad, id: results[0].id });
  });
});

// Mobilyaları getir
app.get('/api/furniture', (req, res) => {
  db.query('SELECT * FROM furniture_items', (err, results) => {
    res.json(results);
  });
});

// Tasarım kaydet
app.post('/api/designs', (req, res) => {
  const { token, baslik, veri } = req.body;
  try {
    const decoded = jwt.verify(token, 'gizli_anahtar');
    db.query('INSERT INTO designs (user_id, baslik, veri) VALUES (?, ?, ?)',
      [decoded.id, baslik, JSON.stringify(veri)], (err, result) => {
      if (err) return res.json({ hata: 'Kayıt hatası' });
      res.json({ mesaj: 'Tasarım kaydedildi', id: result.insertId });
    });
  } catch(e) { res.json({ hata: 'Geçersiz token' }); }
});

// Tasarımları getir
app.get('/api/designs', (req, res) => {
  const token = req.headers.authorization;
  try {
    const decoded = jwt.verify(token, 'gizli_anahtar');
    db.query('SELECT * FROM designs WHERE user_id = ?', [decoded.id], (err, results) => {
      res.json(results);
    });
  } catch(e) { res.json({ hata: 'Geçersiz token' }); }
});

app.listen(3000, () => console.log('Sunucu 3000 portunda çalışıyor...'));