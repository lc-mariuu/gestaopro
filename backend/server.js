require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// servir arquivos estáticos do frontend
app.use(express.static(path.join(__dirname, 'public')));
// servir uploads (fotos de OS)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// rotas da API
app.use('/api/auth',      require('./routes/auth'));
app.use('/api/clientes',  require('./routes/clientes'));
app.use('/api/produtos',  require('./routes/produtos'));
app.use('/api/ordens',    require('./routes/ordens'));
app.use('/api/vendas',    require('./routes/vendas'));
app.use('/api/caixa',     require('./routes/caixa'));
app.use('/api/dashboard', require('./routes/dashboard'));

// SPA fallback
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api'))
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  else
    res.status(404).json({ error: 'Rota não encontrada' });
});

const PORT = process.env.PORT || 3001;
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/gestaopro')
  .then(() => {
    console.log('✓ MongoDB conectado');
    app.listen(PORT, () => console.log(`✓ Servidor na porta ${PORT}`));
  })
  .catch(err => { console.error('✗ MongoDB erro:', err.message); process.exit(1); });
