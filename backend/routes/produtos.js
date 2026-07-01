const router = require('express').Router();
const auth = require('../middleware/auth');
const { Produto } = require('../models');

router.get('/', auth, async (req, res) => {
  try {
    const q = req.query.q;
    const filter = { user: req.user.id };
    if (q) filter.$or = [{ nome: new RegExp(q,'i') }, { codigo: new RegExp(q,'i') }, { categoria: new RegExp(q,'i') }];
    const produtos = await Produto.find(filter).sort({ nome: 1 });
    res.json(produtos);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.get('/barcode/:codigo', auth, async (req, res) => {
  try {
    const p = await Produto.findOne({ user: req.user.id, codigo: req.params.codigo });
    if (!p) return res.status(404).json({ error: 'Não encontrado' });
    res.json(p);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const p = await Produto.findOne({ _id: req.params.id, user: req.user.id });
    if (!p) return res.status(404).json({ error: 'Não encontrado' });
    res.json(p);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const p = await Produto.create({ ...req.body, user: req.user.id });
    res.json(p);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const p = await Produto.findOneAndUpdate({ _id: req.params.id, user: req.user.id }, req.body, { new: true });
    res.json(p);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await Produto.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    res.json({ ok: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.post('/:id/estoque', auth, async (req, res) => {
  try {
    const { tipo, qtd } = req.body;
    const p = await Produto.findOne({ _id: req.params.id, user: req.user.id });
    if (!p) return res.status(404).json({ error: 'Não encontrado' });
    p.estoque += tipo === 'entrada' ? qtd : -qtd;
    await p.save();
    res.json(p);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
