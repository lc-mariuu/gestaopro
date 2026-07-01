const router = require('express').Router();
const auth = require('../middleware/auth');
const { Cliente, OS, Venda } = require('../models');

router.get('/', auth, async (req, res) => {
  try {
    const q = req.query.q;
    const filter = { user: req.user.id };
    if (q) filter.$or = [{ nome: new RegExp(q,'i') }, { telefone: new RegExp(q,'i') }, { doc: new RegExp(q,'i') }];
    const clientes = await Cliente.find(filter).sort({ nome: 1 });
    res.json(clientes);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const cliente = await Cliente.findOne({ _id: req.params.id, user: req.user.id });
    if (!cliente) return res.status(404).json({ error: 'Não encontrado' });
    const [ordens, vendas] = await Promise.all([
      OS.find({ user: req.user.id, cliente: cliente._id }).sort({ createdAt: -1 }),
      Venda.find({ user: req.user.id, cliente: cliente._id }).sort({ createdAt: -1 }),
    ]);
    const totalGasto = ordens.reduce((s,o)=>s+(o.valorServico||0)+(o.pecas||[]).reduce((sp,p)=>sp+(p.valor||0)*(p.qtd||0),0),0)
      + vendas.filter(v=>!v.estornada).reduce((s,v)=>s+(v.total||0),0);
    res.json({ cliente, ordens, vendas, totalGasto });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const c = await Cliente.create({ ...req.body, user: req.user.id });
    res.json(c);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const c = await Cliente.findOneAndUpdate({ _id: req.params.id, user: req.user.id }, req.body, { new: true });
    res.json(c);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await Cliente.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    res.json({ ok: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
