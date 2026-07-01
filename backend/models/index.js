const mongoose = require('mongoose');
const { Schema } = mongoose;

/* ── USER ── */
const UserSchema = new Schema({
  nome: String,
  email: { type: String, unique: true },
  senha: String,
  loja: { type: String, default: 'Minha Assistência' },
  tecnicos: { type: [String], default: ['Técnico'] },
  pagamentos: { type: [String], default: ['Dinheiro', 'PIX', 'Cartão de Crédito', 'Cartão de Débito'] },
  garantiaDias: { type: Number, default: 90 },
  precoHora: { type: Number, default: 8 },
}, { timestamps: true });

/* ── CLIENTE ── */
const ClienteSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User' },
  nome: String,
  telefone: String,
  email: String,
  doc: String,
  obs: String,
}, { timestamps: true });

/* ── PRODUTO ── */
const ProdutoSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User' },
  nome: String,
  codigo: String,
  categoria: String,
  custo: { type: Number, default: 0 },
  preco: { type: Number, default: 0 },
  estoque: { type: Number, default: 0 },
  estoqueMin: { type: Number, default: 3 },
}, { timestamps: true });

/* ── ORDEM DE SERVIÇO ── */
const OSSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User' },
  numero: Number,
  cliente: { type: Schema.Types.ObjectId, ref: 'Cliente' },
  tecnico: String,
  equipamento: String,
  marca: String,
  modelo: String,
  serie: String,
  defeito: String,
  acessorios: String,
  diagnostico: String,
  valorServico: { type: Number, default: 0 },
  pecas: [{
    produtoId: { type: Schema.Types.ObjectId, ref: 'Produto' },
    nome: String,
    qtd: Number,
    valor: Number,
  }],
  fotos: [String],
  status: { type: String, default: 'aberta' },
  prioridade: { type: String, default: 'normal' },
  dataPrevista: String,
  dataEntrega: Date,
  garantiaDias: Number,
  pagamento: String,
  assinatura: String,
}, { timestamps: true });

/* ── VENDA ── */
const VendaSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User' },
  numero: Number,
  cliente: { type: Schema.Types.ObjectId, ref: 'Cliente' },
  itens: [{
    produtoId: { type: Schema.Types.ObjectId, ref: 'Produto' },
    nome: String,
    qtd: Number,
    preco: Number,
    custo: Number,
  }],
  desconto: { type: Number, default: 0 },
  total: Number,
  pagamento: String,
  estornada: { type: Boolean, default: false },
}, { timestamps: true });

/* ── CAIXA ── */
const CaixaSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User' },
  tipo: { type: String, enum: ['entrada', 'saida'] },
  categoria: String,
  descricao: String,
  valor: Number,
  pagamento: String,
  ref: String,
}, { timestamps: true });

module.exports = {
  User:    mongoose.model('User',    UserSchema),
  Cliente: mongoose.model('Cliente', ClienteSchema),
  Produto: mongoose.model('Produto', ProdutoSchema),
  OS:      mongoose.model('OS',      OSSchema),
  Venda:   mongoose.model('Venda',   VendaSchema),
  Caixa:   mongoose.model('Caixa',   CaixaSchema),
};
