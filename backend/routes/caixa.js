const router = require('express').Router();
const auth = require('../middleware/auth');
const { Caixa } = require('../models');

router.get('/', auth, async (req, res) => {
  try {
    const { de, ate } = req.query;
    const filter = { user: req.user.id };
    if (de && ate) filter.createdAt = { $gte: new Date(de), $lte: new Date(ate + 'T23:59:59') };
    const movs = await Caixa.find(filter).sort({ createdAt: -1 });
    res.json(movs);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const m = await Caixa.create({ ...req.body, user: req.user.id });
    res.json(m);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await Caixa.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    res.json({ ok: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
