const router = require('express').Router();
const auth = require('../middleware/auth');
const { Venda, Produto, Caixa } = require('../models');

router.get('/', auth, async (req, res) => {
  try {
    const { de, ate } = req.query;
    const filter = { user: req.user.id };
    if (de && ate) filter.createdAt = { $gte: new Date(de), $lte: new Date(ate + 'T23:59:59') };
    const vendas = await Venda.find(filter).sort({ createdAt: -1 });
    res.json(vendas);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { itens, desconto, pagamento, clienteId } = req.body;
    const total = Math.max(0, itens.reduce((s,i) => s + i.preco * i.qtd, 0) - (desconto || 0));
    const count = await Venda.countDocuments({ user: req.user.id });

    // atualizar estoque
    for (const item of itens) {
      if (item.produtoId) {
        const p = await Produto.findById(item.produtoId);
        if (p) { p.estoque = Math.max(0, p.estoque - item.qtd); await p.save(); item.custo = p.custo; }
      }
    }

    const venda = await Venda.create({ user: req.user.id, numero: count + 1, cliente: clienteId || null, itens, desconto: desconto || 0, total, pagamento });
    await Caixa.create({ user: req.user.id, tipo: 'entrada', categoria: 'Venda PDV', descricao: `Venda #${venda.numero}`, valor: total, pagamento, ref: venda._id.toString() });
    res.json(venda);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
