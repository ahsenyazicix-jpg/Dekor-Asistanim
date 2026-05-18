const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ mesaj: 'Dekor Asistanım API çalışıyor!' });
});

app.listen(3000, () => {
  console.log('Sunucu 3000 portunda çalışıyor...');
});