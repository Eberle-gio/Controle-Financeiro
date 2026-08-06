// Simulador de chamadas de API com atraso de rede (delay)
const delay = (ms = 800) => new Promise(resolve => setTimeout(resolve, ms));

// Categorias padrão
const DEFAULT_CATEGORIES = [
  { id: 1, name: 'Salário',       tipo: 'RECEITA', cor: '#10b981', icone: 'Briefcase'       },
  { id: 2, name: 'Investimentos', tipo: 'RECEITA', cor: '#3b82f6', icone: 'TrendingUp'       },
  { id: 3, name: 'Alimentação',   tipo: 'DESPESA', cor: '#f59e0b', icone: 'UtensilsCrossed'  },
  { id: 4, name: 'Transporte',    tipo: 'DESPESA', cor: '#6366f1', icone: 'Car'              },
  { id: 5, name: 'Moradia',       tipo: 'DESPESA', cor: '#ef4444', icone: 'House'            },
  { id: 6, name: 'Lazer',         tipo: 'DESPESA', cor: '#ec4899', icone: 'PartyPopper'      },
];

// Transações iniciais mockadas para a carteira padrão
const getInitialTransactions = (walletId, userId) => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');

  return [
    {
      id: 1,
      walletId,
      categoryId: 1, // Salário
      tipo: 'RECEITA',
      valor: 5000.00,
      descricao: 'Salário Mensal',
      date: `${year}-${month}-05`,
      criadoPor: userId,
      criadoEm: new Date().toISOString()
    },
    {
      id: 2,
      walletId,
      categoryId: 3, // Alimentação
      tipo: 'DESPESA',
      valor: 450.00,
      descricao: 'Supermercado Mensal',
      date: `${year}-${month}-10`,
      criadoPor: userId,
      criadoEm: new Date().toISOString()
    },
    {
      id: 3,
      walletId,
      categoryId: 4, // Transporte
      tipo: 'DESPESA',
      valor: 150.00,
      descricao: 'Combustível',
      date: `${year}-${month}-12`,
      criadoPor: userId,
      criadoEm: new Date().toISOString()
    },
    {
      id: 4,
      walletId,
      categoryId: 2, // Investimentos
      tipo: 'RECEITA',
      valor: 800.00,
      descricao: 'Dividendos Ações',
      date: `${year}-${month}-15`,
      criadoPor: userId,
      criadoEm: new Date().toISOString()
    },
    {
      id: 5,
      walletId,
      categoryId: 5, // Moradia
      tipo: 'DESPESA',
      valor: 1200.00,
      descricao: 'Aluguel do mês',
      date: `${year}-${month}-20`,
      criadoPor: userId,
      criadoEm: new Date().toISOString()
    },
    {
      id: 6,
      walletId,
      categoryId: 6, // Lazer
      tipo: 'DESPESA',
      valor: 250.00,
      descricao: 'Jantar com amigos',
      date: `${year}-${month}-22`,
      criadoPor: userId,
      criadoEm: new Date().toISOString()
    }
  ];
};

// Funções Auxiliares de LocalStorage
const getStorageData = (key, defaultValue = []) => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : defaultValue;
};

const setStorageData = (key, data) => {
  localStorage.setItem(key, JSON.stringify(data));
};

export const mockService = {
  // --- AUTENTICAÇÃO ---

  login: async (email, password) => {
    await delay(1000);
    const users = getStorageData('users');
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!user || user.password !== password) {
      throw new Error('Credenciais inválidas');
    }

    const token = 'mock_jwt_token_' + Math.random().toString(36).substring(2);
    const session = {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    };
    
    setStorageData('current_session', session);
    return session;
  },

  register: async (name, email, password) => {
    await delay(1000);
    const users = getStorageData('users');

    if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
      throw new Error('E-mail já cadastrado');
    }

    const newUserId = users.length + 1;
    const newUser = {
      id: newUserId,
      name,
      email,
      password,
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    setStorageData('users', users);

    // Inicializa Categorias do Usuário
    const userCategories = getStorageData('categories');
    const newUserCategories = DEFAULT_CATEGORIES.map(cat => ({
      ...cat,
      id: Math.floor(Math.random() * 1000000), // id único numérico
      userId: newUserId
    }));
    setStorageData('categories', [...userCategories, ...newUserCategories]);

    // Inicializa Carteira Padrão para o Usuário
    const wallets = getStorageData('wallets');
    const newWalletId = wallets.length + 1;
    const newWallet = {
      id: newWalletId,
      donoId: newUserId,
      nome: 'Minhas Finanças',
      descricao: 'Minha carteira de finanças pessoal',
      criadoEm: new Date().toISOString()
    };
    wallets.push(newWallet);
    setStorageData('wallets', wallets);

    // Adiciona o criador como membro OWNER da carteira
    const members = getStorageData('wallet_members');
    members.push({
      id: members.length + 1,
      walletId: newWalletId,
      userId: newUserId,
      papel: 'DONO',
      entradoEm: new Date().toISOString()
    });
    setStorageData('wallet_members', members);

    // Pré-popula transações fictícias para exibição inicial no Dashboard
    const transactions = getStorageData('transactions');
    const initialTrans = getInitialTransactions(newWalletId, newUserId);
    setStorageData('transactions', [...transactions, ...initialTrans]);

    return {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      createdAt: newUser.createdAt
    };
  },

  logout: async () => {
    localStorage.removeItem('current_session');
    return true;
  },

  getCurrentUser: () => {
    const session = getStorageData('current_session', null);
    if (!session) return null;
    if (session.user) return session.user;
    return { name: 'Usuário', email: '' };
  },

  getToken: () => {
    const token = localStorage.getItem('accessToken');
    if (token) return token;
    const session = getStorageData('current_session', null);
    return session ? (session.accessToken || session.token) : null;
  },

  isAuthenticated: () => {
    return !!mockService.getToken();
  },

  // --- ALTERAÇÃO DE SENHA (ÁREA AUTENTICADA) ---
  
  changePassword: async (currentPassword, newPassword) => {
    await delay(1000);
    const session = getStorageData('current_session', null);
    if (!session) {
      throw new Error('Usuário não autenticado');
    }

    const users = getStorageData('users');
    const userIndex = users.findIndex(u => u.id === session.user.id);
    
    if (userIndex === -1) {
      throw new Error('Usuário não encontrado');
    }

    if (users[userIndex].password !== currentPassword) {
      throw new Error('Senha atual incorreta');
    }

    users[userIndex].password = newPassword;
    setStorageData('users', users);
    return { message: 'Senha alterada com sucesso.' };
  },

  // --- RECUPERAÇÃO DE SENHA (FORGOT PASSWORD) ---

  forgotPassword: async (email) => {
    await delay(1000);
    const users = getStorageData('users');
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    const token = 'reset_token_' + Math.random().toString(36).substring(2);
    const expiraEm = new Date(Date.now() + 3600000).toISOString(); // 1 hora de validade

    const resetTokens = getStorageData('reset_tokens');
    
    if (user) {
      resetTokens.push({
        id: resetTokens.length + 1,
        userId: user.id,
        token,
        expiraEm,
        utilizado: false
      });
      setStorageData('reset_tokens', resetTokens);
    }

    // Retorna mensagem neutra conforme as especificações de segurança
    return {
      message: 'Se este e-mail estiver cadastrado, você receberá as instruções em breve.',
      debugToken: token // Facilitador de testes locais requerido pela especificação
    };
  },

  resetPassword: async (token, newPassword) => {
    await delay(1000);
    const resetTokens = getStorageData('reset_tokens');
    const tokenObj = resetTokens.find(t => t.token === token && !t.utilizado);

    if (!tokenObj) {
      throw new Error('Token inválido ou já utilizado');
    }

    if (new Date() > new Date(tokenObj.expiraEm)) {
      throw new Error('Token expirado');
    }

    const users = getStorageData('users');
    const userIndex = users.findIndex(u => u.id === tokenObj.userId);

    if (userIndex === -1) {
      throw new Error('Usuário não encontrado');
    }

    // Atualiza a senha do usuário
    users[userIndex].password = newPassword;
    setStorageData('users', users);

    // Marca o token como utilizado
    tokenObj.utilizado = true;
    setStorageData('reset_tokens', resetTokens);

    return { message: 'Senha redefinida com sucesso.' };
  },

  // --- CARTEIRAS E DASHBOARD ---

  getWallets: async () => {
    await delay(800);
    const session = getStorageData('current_session', null);
    if (!session) throw new Error('Usuário não autenticado');

    const members = getStorageData('wallet_members');
    const userWalletIds = members
      .filter(m => m.userId === session.user.id)
      .map(m => m.walletId);

    const wallets = getStorageData('wallets');
    return wallets.filter(w => userWalletIds.includes(w.id));
  },

  getWalletSummary: async (walletId, startDate, endDate) => {
    await delay(1000);
    const session = getStorageData('current_session', null);
    if (!session) throw new Error('Usuário não autenticado');

    // Valida se o usuário é membro da carteira
    const members = getStorageData('wallet_members');
    const isMember = members.some(m => m.walletId === Number(walletId) && m.userId === session.user.id);
    if (!isMember) throw new Error('Sem acesso a esta carteira');

    const transactions = getStorageData('transactions');
    const walletTransactions = transactions.filter(t => t.walletId === Number(walletId));

    // Filtra transações por data
    const filtered = walletTransactions.filter(t => {
      if (startDate && t.date < startDate) return false;
      if (endDate && t.date > endDate) return false;
      return true;
    });

    const totalIncome = filtered
      .filter(t => t.tipo === 'RECEITA')
      .reduce((sum, t) => sum + Number(t.valor), 0);

    const totalExpense = filtered
      .filter(t => t.tipo === 'DESPESA')
      .reduce((sum, t) => sum + Number(t.valor), 0);

    const balance = totalIncome - totalExpense;

    // Agrupa por categoria
    const categories = getStorageData('categories');
    const byCategoryMap = {};
    filtered.forEach(t => {
      const cat = categories.find(c => c.id === t.categoryId);
      const catName = cat ? cat.name : 'Outros';
      const catId = t.categoryId || 0;
      
      if (!byCategoryMap[catId]) {
        byCategoryMap[catId] = { categoryId: catId, categoryName: catName, total: 0 };
      }
      byCategoryMap[catId].total += Number(t.valor);
    });

    // Agrupa por mês/dia para gráficos
    const byDateMap = {};
    filtered.forEach(t => {
      // Agrupa por dia para gráfico corrido ou mês (YYYY-MM)
      const dateKey = t.date; // usar data completa YYYY-MM-DD
      if (!byDateMap[dateKey]) {
        byDateMap[dateKey] = { date: dateKey, receitas: 0, despesas: 0 };
      }
      if (t.tipo === 'RECEITA') {
        byDateMap[dateKey].receitas += Number(t.valor);
      } else {
        byDateMap[dateKey].despesas += Number(t.valor);
      }
    });

    // Ordena transações recentes para a lista
    const recentTransactions = [...filtered]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 10)
      .map(t => {
        const cat = categories.find(c => c.id === t.categoryId);
        return {
          ...t,
          categoryName: cat ? cat.name : 'Sem Categoria',
          categoryColor: cat ? cat.cor : '#6b7280',
          categoryIcon: cat ? cat.icone : '📝'
        };
      });

    return {
      totalIncome,
      totalExpense,
      balance,
      transactionCount: filtered.length,
      byCategory: Object.values(byCategoryMap),
      byDate: Object.values(byDateMap).sort((a, b) => a.date.localeCompare(b.date)),
      recentTransactions
    };
  }
};
