const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');
const { User } = require('../models');

const sign = u => jwt.sign({ id: u._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '30d' });
const safe = u => ({ _id:u._id, nome:u.nome, email:u.email, loja:u.loja, tecnicos:u.tecnicos, pagamentos:u.pagamentos, garantiaDias:u.garantiaDias, precoHora:u.precoHora });

router.post('/register', async (req, res) => {
  try {
    const { nome, email, senha, loja } = req.body;
    if (!nome || !email || !senha) return res.status(400).json({ error: 'Campos obrigatórios' });
    const existe = await User.findOne({ email });
    if (existe) return res.status(400).json({ error: 'E-mail já cadastrado' });
    const hash = await bcrypt.hash(senha, 10);
    const user = await User.create({ nome, email, senha: hash, loja: loja || nome });
    res.json({ token: sign(user), user: safe(user) });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.post('/login', async (req, res) => {
  try {
    const { email, senha } = req.body;
    if (!email || !senha) return res.status(400).json({ error: 'Informe e-mail e senha' });
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'Usuário não encontrado' });
    const ok = await bcrypt.compare(senha, user.senha);
    if (!ok) return res.status(400).json({ error: 'Senha incorreta' });
    res.json({ token: sign(user), user: safe(user) });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'Não encontrado' });
    res.json(safe(user));
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.put('/config', auth, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.user.id, req.body, { new: true });
    res.json(safe(user));
  } catch(e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
