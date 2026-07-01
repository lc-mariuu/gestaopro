const router = require('express').Router();
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { OS, Caixa } = require('../models');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

router.get('/', auth, async (req, res) => {
  try {
    const { status, q } = req.query;
    const filter = { user: req.user.id };
    if (status) filter.status = status;
    if (q) filter.$or = [{ equipamento: new RegExp(q,'i') }, { defeito: new RegExp(q,'i') }];
    const ordens = await OS.find(filter).populate('cliente','nome telefone').sort({ createdAt: -1 });
    res.json(ordens);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const o = await OS.findOne({ _id: req.params.id, user: req.user.id }).populate('cliente','nome telefone email');
    if (!o) return res.status(404).json({ error: 'Não encontrado' });
    res.json(o);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const count = await OS.countDocuments({ user: req.user.id });
    const o = await OS.create({ ...req.body, user: req.user.id, numero: count + 1, pecas: req.body.pecas || [] });
    res.json(o);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const o = await OS.findOneAndUpdate({ _id: req.params.id, user: req.user.id }, req.body, { new: true });
    res.json(o);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await OS.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    res.json({ ok: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.post('/:id/status', auth, async (req, res) => {
  try {
    const o = await OS.findOneAndUpdate({ _id: req.params.id, user: req.user.id }, { status: req.body.status }, { new: true });
    res.json(o);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.post('/:id/entregar', auth, async (req, res) => {
  try {
    const { pagamento, assinatura } = req.body;
    const o = await OS.findOne({ _id: req.params.id, user: req.user.id });
    if (!o) return res.status(404).json({ error: 'Não encontrado' });
    const total = (o.valorServico || 0) + (o.pecas || []).reduce((s,p) => s + (p.valor||0)*(p.qtd||0), 0);
    o.status = 'entregue';
    o.pagamento = pagamento;
    o.assinatura = assinatura;
    o.dataEntrega = new Date();
    await o.save();
    await Caixa.create({ user: req.user.id, tipo: 'entrada', categoria: 'Ordem de Serviço', descricao: `OS #${o.numero} — ${o.equipamento}`, valor: total, pagamento, ref: o._id.toString() });
    res.json(o);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.post('/:id/fotos', auth, upload.array('fotos', 10), async (req, res) => {
  try {
    const urls = req.files.map(f => '/uploads/' + f.filename);
    const o = await OS.findOne({ _id: req.params.id, user: req.user.id });
    o.fotos = [...(o.fotos || []), ...urls];
    await o.save();
    res.json(o);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id/fotos', auth, async (req, res) => {
  try {
    const { foto } = req.body;
    const o = await OS.findOne({ _id: req.params.id, user: req.user.id });
    o.fotos = (o.fotos || []).filter(f => f !== foto);
    await o.save();
    res.json(o);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
