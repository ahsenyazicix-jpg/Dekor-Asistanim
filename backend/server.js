const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
  host: process.env.MYSQLHOST || 'localhost',
  user: process.env.MYSQLUSER || 'root',
  password: process.env.MYSQLPASSWORD || 'root1234',
  database: process.env.MYSQLDATABASE || 'dekor_asistanim',
  port: process.env.MYSQLPORT || 3306
});

db.connect((err) => {
  if (err) console.log('DB Hata:', err);
  else {
    console.log('MySQL bağlantısı başarılı!');
    db.query(`CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      ad VARCHAR(100),
      email VARCHAR(100) UNIQUE,
      sifre VARCHAR(255)
    )`);
    db.query(`CREATE TABLE IF NOT EXISTS designs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT,
      baslik VARCHAR(100),
      veri JSON,
      olusturulma TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);
    db.query(`CREATE TABLE IF NOT EXISTS furniture_items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      ad VARCHAR(100),
      kategori VARCHAR(50),
      fiyat DECIMAL(10,2)
    )`);
    db.query(`INSERT IGNORE INTO furniture_items (ad, kategori, fiyat) VALUES
      ('Üçlü Koltuk','Oturma Odası',8500),
      ('İkili Koltuk','Oturma Odası',6200),
      ('Tekli Koltuk','Oturma Odası',3800),
      ('Orta Sehpa','Oturma Odası',2100),
      ('TV Ünitesi','Oturma Odası',4500),
      ('Raf Ünitesi','Oturma Odası',3200),
      ('Çift Kişilik Yatak','Yatak Odası',12000),
      ('Tek Kişilik Yatak','Yatak Odası',7500),
      ('Gardırop 3 Kapılı','Yatak Odası',9800),
      ('Komodin','Yatak Odası',1800),
      ('Şifonyer','Yatak Odası',4200),
      ('Yemek Masası','Yemek Odası',7800),
      ('Sandalye','Yemek Odası',1200),
      ('Vitrin','Yemek Odası',5500),
      ('Büfe','Yemek Odası',6800),
      ('Çalışma Masası','Çalışma Odası',3500),
      ('Ofis Koltuğu','Çalışma Odası',2800),
      ('Kitaplık','Çalışma Odası',4100),
      ('Avize','Aydınlatma',2500),
      ('Abajur','Aydınlatma',850),
      ('Zemin Lambası','Aydınlatma',1600),
      ('Halı 200x300','Aksesuar',3200),
      ('Halı 150x200','Aksesuar',2100),
      ('Perde Takımı','Aksesuar',1800),
      ('Duvar Rafı','Aksesuar',650)
    `);
  }
});

app.post('/api/register', async (req, res) => {
  const { ad, email, sifre } = req.body;
  const hash = await bcrypt.hash(sifre, 10);
  db.query('INSERT INTO users (ad, email, sifre) VALUES (?, ?, ?)',
    [ad, email, hash], (err) => {
    if (err) return res.json({ hata: 'Email zaten kayıtlı' });
    res.json({ mesaj: 'Kayıt başarılı' });
  });
});

app.post('/api/login', async (req, res) => {
  const { email, sifre } = req.body;
  db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
    if (!results || results.length === 0) return res.json({ hata: 'Kullanıcı bulunamadı' });
    const dogru = await bcrypt.compare(sifre, results[0].sifre);
    if (!dogru) return res.json({ hata: 'Şifre yanlış' });
    const token = jwt.sign({ id: results[0].id }, 'gizli_anahtar');
    res.json({ token, ad: results[0].ad, id: results[0].id });
  });
});

app.get('/api/furniture', (req, res) => {
  db.query('SELECT * FROM furniture_items', (err, results) => {
    if (err) return res.json([]);
    res.json(results);
  });
});

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

app.get('/api/designs', (req, res) => {
  const token = req.headers.authorization;
  try {
    const decoded = jwt.verify(token, 'gizli_anahtar');
    db.query('SELECT * FROM designs WHERE user_id = ?', [decoded.id], (err, results) => {
      res.json(results || []);
    });
  } catch(e) { res.json({ hata: 'Geçersiz token' }); }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Sunucu ' + PORT + ' portunda çalışıyor...'));