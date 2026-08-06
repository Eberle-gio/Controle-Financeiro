/**
 * Central de Dados Demonstrativos (Mock Data) do NodeBank
 * Arquivo centralizado contendo carteiras, resumo financeiro, categorias e transações iniciais
 * para exibição rica de gráficos e indicadores no Dashboard.
 */

export const INITIAL_MOCK_WALLETS = [
  {
    id: 1,
    nome: 'Carteira Principal',
    descricao: 'Minha carteira padrão de despesas e receitas',
    meuPapel: 'DONO'
  },
  {
    id: 2,
    nome: 'Carteira Compartilhada',
    descricao: 'Despesas da casa e viagens em grupo',
    meuPapel: 'EDITOR'
  }
];

export const INITIAL_MOCK_CATEGORIES = [
  { id: 1, name: 'Salário', cor: '#10b981', icone: 'DollarSign', tipo: 'RECEITA' },
  { id: 2, name: 'Investimentos', cor: '#3b82f6', icone: 'TrendingUp', tipo: 'RECEITA' },
  { id: 3, name: 'Alimentação', cor: '#f59e0b', icone: 'ShoppingBag', tipo: 'DESPESA' },
  { id: 4, name: 'Moradia', cor: '#ef4444', icone: 'Home', tipo: 'DESPESA' },
  { id: 5, name: 'Transporte', cor: '#8b5cf6', icone: 'Car', tipo: 'DESPESA' },
  { id: 6, name: 'Lazer', cor: '#ec4899', icone: 'Smile', tipo: 'DESPESA' }
];

export const INITIAL_MOCK_SUMMARY = {
  totalIncome: 5950.00,
  totalExpense: 3570.00,
  balance: 2380.00,
  byCategory: [
    { id: 1, categoryName: 'Salário', categoryColor: '#10b981', categoryIcon: 'DollarSign', total: 5500.00 },
    { id: 2, categoryName: 'Investimentos', categoryColor: '#3b82f6', categoryIcon: 'TrendingUp', total: 450.00 },
    { id: 3, categoryName: 'Alimentação', categoryColor: '#f59e0b', categoryIcon: 'ShoppingBag', total: 1250.00 },
    { id: 4, categoryName: 'Moradia', categoryColor: '#ef4444', categoryIcon: 'Home', total: 1800.00 },
    { id: 5, categoryName: 'Transporte', categoryColor: '#8b5cf6', categoryIcon: 'Car', total: 320.00 },
    { id: 6, categoryName: 'Lazer', categoryColor: '#ec4899', categoryIcon: 'Smile', total: 200.00 }
  ],
  byDate: [
    { date: '2026-08-01', receitas: 5500.00, despesas: 0 },
    { date: '2026-08-05', receitas: 0, despesas: 1250.00 },
    { date: '2026-08-10', receitas: 450.00, despesas: 0 },
    { date: '2026-08-12', receitas: 0, despesas: 1800.00 },
    { date: '2026-08-15', receitas: 0, despesas: 320.00 },
    { date: '2026-08-18', receitas: 0, despesas: 200.00 }
  ],
  recentTransactions: [
    {
      id: 1,
      descricao: 'Salário Mensal',
      valor: 5500.00,
      tipo: 'RECEITA',
      data: '2026-08-01',
      categoryName: 'Salário',
      categoryIcon: 'DollarSign',
      categoryColor: '#10b981'
    },
    {
      id: 2,
      descricao: 'Supermercado do Mês',
      valor: 1250.00,
      tipo: 'DESPESA',
      data: '2026-08-05',
      categoryName: 'Alimentação',
      categoryIcon: 'ShoppingBag',
      categoryColor: '#f59e0b'
    },
    {
      id: 3,
      descricao: 'Rendimento de Investimentos',
      valor: 450.00,
      tipo: 'RECEITA',
      data: '2026-08-10',
      categoryName: 'Investimentos',
      categoryIcon: 'TrendingUp',
      categoryColor: '#3b82f6'
    },
    {
      id: 4,
      descricao: 'Aluguel e Condomínio',
      valor: 1800.00,
      tipo: 'DESPESA',
      data: '2026-08-12',
      categoryName: 'Moradia',
      categoryIcon: 'Home',
      categoryColor: '#ef4444'
    },
    {
      id: 5,
      descricao: 'Combustível e Transporte',
      valor: 320.00,
      tipo: 'DESPESA',
      data: '2026-08-15',
      categoryName: 'Transporte',
      categoryIcon: 'Car',
      categoryColor: '#8b5cf6'
    },
    {
      id: 6,
      descricao: 'Jantar e Cinema',
      valor: 200.00,
      tipo: 'DESPESA',
      data: '2026-08-18',
      categoryName: 'Lazer',
      categoryIcon: 'Smile',
      categoryColor: '#ec4899'
    }
  ]
};
