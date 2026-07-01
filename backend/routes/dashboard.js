const router = require('express').Router();
const auth = require('../middleware/auth');
const { OS, Venda, Cliente, Produto, Caixa } = require('../models');

router.get('/', auth, async (req, res) => {
  try {
    const uid = req.user.id;
    const hoje = new Date(); hoje.setHours(0,0,0,0);
    const amanha = new Date(hoje); amanha.setDate(amanha.getDate()+1);
    const mesInicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const now = new Date().toISOString().slice(0,10);

    const [movHoje, movMes, osAbertas, clientes, produtos, osRecentes, baixoEstoque, movs30] = await Promise.all([
      Caixa.find({ user:uid, createdAt:{$gte:hoje,$lt:amanha} }),
      Caixa.find({ user:uid, createdAt:{$gte:mesInicio} }),
      OS.find({ user:uid, status:{$ne:'entregue'} }),
      Cliente.countDocuments({ user:uid }),
      Produto.find({ user:uid }),
      OS.find({ user:uid }).populate('cliente','nome').sort({ createdAt:-1 }).limit(5),
      Produto.find({ user:uid }).then(ps => ps.filter(p=>p.estoque<=p.estoqueMin)),
      Caixa.find({ user:uid, createdAt:{$gte:new Date(Date.now()-29*86400000)} }),
    ]);

    const entHoje = movHoje.filter(m=>m.tipo==='entrada').reduce((s,m)=>s+m.valor,0);
    const saiHoje = movHoje.filter(m=>m.tipo==='saida').reduce((s,m)=>s+m.valor,0);
    const vendasHoje = movHoje.filter(m=>m.tipo==='entrada'&&m.ref).length;
    const entMes = movMes.filter(m=>m.tipo==='entrada').reduce((s,m)=>s+m.valor,0);
    const saiMes = movMes.filter(m=>m.tipo==='saida').reduce((s,m)=>s+m.valor,0);

    // grafico 30 dias
    const dias = {};
    for (let i=29;i>=0;i--) {
      const d = new Date(Date.now()-i*86400000).toISOString().slice(0,10);
      dias[d] = { data:d, entrada:0, saida:0 };
    }
    movs30.forEach(m => {
      const d = new Date(m.createdAt).toISOString().slice(0,10);
      if (dias[d]) dias[d][m.tipo] += m.valor;
    });

    // pagamentos do mes
    const pagMes = {};
    movMes.filter(m=>m.tipo==='entrada'&&m.pagamento).forEach(m=>{
      pagMes[m.pagamento] = (pagMes[m.pagamento]||0)+m.valor;
    });

    res.json({
      hoje: { faturamento:entHoje, lucro:entHoje-saiHoje, vendas:vendasHoje },
      mes:  { faturamento:entMes,  lucro:entMes-saiMes },
      totais: { osAbertas:osAbertas.length, clientes, produtos:produtos.length },
      alertas: {
        osAtrasadas: osAbertas.filter(o=>o.dataPrevista&&o.dataPrevista<now).length,
        osProntas:   osAbertas.filter(o=>o.status==='pronta').length,
        baixoEstoque: baixoEstoque.length,
      },
      grafico30: Object.values(dias),
      pagamentosMes: pagMes,
      osRecentes,
      baixoEstoque: baixoEstoque.slice(0,5),
    });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
