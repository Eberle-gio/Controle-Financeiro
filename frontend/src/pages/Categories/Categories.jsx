import { useState, useEffect, useCallback } from 'react';
import { categoryService } from '../../services/categoryService';
import { authService } from '../../services/authService';
import Sidebar from '../../components/Sidebar';
import CategoryIcon from '../../components/CategoryIcon';
import { Plus, Trash2, Edit2, X, Check, AlertCircle } from 'lucide-react';
import './Categories.css';

const ICONES_SUGERIDOS = [
  'Tag', 'Briefcase', 'TrendingUp', 'UtensilsCrossed', 'Car', 'House',
  'PartyPopper', 'ShoppingBag', 'HeartPulse', 'GraduationCap', 'Plane', 'Coffee'
];

const CORES_SUGERIDAS = [
  '#10b981', '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f59e0b', '#14b8a6'
];

const Categories = () => {
  const [usuarioAtual, setUsuarioAtual] = useState(() => authService.obterUsuarioAtual());
  const [categorias, setCategorias] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  // Modal
  const [modalAberto, setModalAberto] = useState(false);
  const [categoriaEmEdicao, setCategoriaEmEdicao] = useState(null);
  const [nome, setNome] = useState('');
  const [tipo, setTipo] = useState('DESPESA');
  const [cor, setCor] = useState('#6366f1');
  const [icone, setIcone] = useState('Tag');
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    const buscarPerfil = async () => {
      try {
        const perfil = await authService.obterPerfil();
        setUsuarioAtual(perfil);
      } catch (e) {}
    };
    buscarPerfil();
  }, []);

  const carregarCategorias = useCallback(async () => {
    setCarregando(true);
    setErro('');
    try {
      const lista = await categoryService.listarCategorias();
      setCategorias(lista);
    } catch (err) {
      setErro(err.message || 'Falha ao carregar categorias');
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregarCategorias();
  }, [carregarCategorias]);

  const abrirCriar = () => {
    setCategoriaEmEdicao(null);
    setNome('');
    setTipo('DESPESA');
    setCor('#6366f1');
    setIcone('Tag');
    setModalAberto(true);
  };

  const abrirEditar = (cat) => {
    setCategoriaEmEdicao(cat);
    setNome(cat.name);
    setTipo(cat.tipo);
    setCor(cat.cor || '#6366f1');
    setIcone(cat.icone || 'Tag');
    setModalAberto(true);
  };

  const salvarCategoria = async (e) => {
    e.preventDefault();
    if (!nome.trim()) return;

    setSalvando(true);
    setErro('');
    try {
      const payload = { name: nome.trim(), tipo, cor, icone };
      if (categoriaEmEdicao) {
        await categoryService.atualizarCategoria(categoriaEmEdicao.id, payload);
      } else {
        await categoryService.criarCategoria(payload);
      }
      setModalAberto(false);
      carregarCategorias();
    } catch (err) {
      setErro(err.message || 'Erro ao salvar categoria');
    } finally {
      setSalvando(false);
    }
  };

  const excluirCategoria = async (id) => {
    if (!window.confirm('Deseja excluir esta categoria? Só será permitido se ela não tiver transações vinculadas.')) return;
    try {
      await categoryService.excluirCategoria(id);
      carregarCategorias();
    } catch (err) {
      alert(err.message || 'Não foi possível excluir a categoria.');
    }
  };

  const despesas = categorias.filter((c) => c.tipo === 'DESPESA');
  const receitas = categorias.filter((c) => c.tipo === 'RECEITA');

  return (
    <div className="categories-page">
      <Sidebar usuarioAtual={usuarioAtual} itemAtivo="categorias" />

      <main className="categories-content">
        <header className="page-header">
          <div className="header-titles">
            <h1>Categorias</h1>
            <p>Classifique suas receitas e despesas para ter um controle preciso do seu dinheiro.</p>
          </div>
          <button onClick={abrirCriar} className="btn-primary-action">
            <Plus size={18} /> Nova Categoria
          </button>
        </header>

        {erro && <div className="alert-error-box">{erro}</div>}

        <div className="categories-sections">
          {/* Seção Despesas */}
          <section className="category-section-card">
            <h3>Categorias de Despesas ({despesas.length})</h3>
            <div className="categories-list">
              {despesas.map((c) => (
                <div key={c.id} className="category-item">
                  <div className="category-item-info">
                    <span className="cat-icon-box" style={{ backgroundColor: `${c.cor}25` }}>
                      <CategoryIcon name={c.icone} color={c.cor} size={18} />
                    </span>
                    <span className="cat-name">{c.name}</span>
                  </div>
                  <div className="cat-actions">
                    <button type="button" onClick={() => abrirEditar(c)} className="btn-cat-action" title="Editar">
                      <Edit2 size={15} />
                    </button>
                    <button type="button" onClick={() => excluirCategoria(c.id)} className="btn-cat-action delete" title="Excluir">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Seção Receitas */}
          <section className="category-section-card">
            <h3>Categorias de Receitas ({receitas.length})</h3>
            <div className="categories-list">
              {receitas.map((c) => (
                <div key={c.id} className="category-item">
                  <div className="category-item-info">
                    <span className="cat-icon-box" style={{ backgroundColor: `${c.cor}25` }}>
                      <CategoryIcon name={c.icone} color={c.cor} size={18} />
                    </span>
                    <span className="cat-name">{c.name}</span>
                  </div>
                  <div className="cat-actions">
                    <button type="button" onClick={() => abrirEditar(c)} className="btn-cat-action" title="Editar">
                      <Edit2 size={15} />
                    </button>
                    <button type="button" onClick={() => excluirCategoria(c.id)} className="btn-cat-action delete" title="Excluir">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>

      {/* Modal Criar / Editar Categoria */}
      {modalAberto && (
        <div className="modal-backdrop" onClick={() => setModalAberto(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <header className="modal-header">
              <h2>{categoriaEmEdicao ? 'Editar Categoria' : 'Nova Categoria'}</h2>
              <button type="button" className="modal-close-btn" onClick={() => setModalAberto(false)}>
                <X size={20} />
              </button>
            </header>

            <form onSubmit={salvarCategoria} className="modal-form">
              <div className="type-toggle-group">
                <button
                  type="button"
                  className={`type-toggle-btn expense ${tipo === 'DESPESA' ? 'active' : ''}`}
                  onClick={() => setTipo('DESPESA')}
                >
                  Despesa
                </button>
                <button
                  type="button"
                  className={`type-toggle-btn income ${tipo === 'RECEITA' ? 'active' : ''}`}
                  onClick={() => setTipo('RECEITA')}
                >
                  Receita
                </button>
              </div>

              <div className="form-group">
                <label htmlFor="cat-name">Nome da Categoria*</label>
                <input
                  id="cat-name"
                  type="text"
                  placeholder="Ex: Farmácia, Bônus, Curso..."
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              {/* Seletor de Cores */}
              <div className="form-group">
                <label>Cor de Destaque</label>
                <div className="color-palette">
                  {CORES_SUGERIDAS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      className={`color-pill ${cor === c ? 'selected' : ''}`}
                      style={{ backgroundColor: c }}
                      onClick={() => setCor(c)}
                    />
                  ))}
                </div>
              </div>

              {/* Seletor de Ícones */}
              <div className="form-group">
                <label>Ícone</label>
                <div className="icon-selector-grid">
                  {ICONES_SUGERIDOS.map((ic) => (
                    <button
                      key={ic}
                      type="button"
                      className={`icon-choice-btn ${icone === ic ? 'selected' : ''}`}
                      onClick={() => setIcone(ic)}
                    >
                      <CategoryIcon name={ic} size={18} color={icone === ic ? '#fff' : 'var(--text-secondary)'} />
                    </button>
                  ))}
                </div>
              </div>

              <div className="modal-actions">
                <div className="modal-right-actions">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setModalAberto(false)}
                    disabled={salvando}
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="btn-primary" disabled={salvando}>
                    <Check size={18} />
                    {salvando ? 'Salvando...' : 'Salvar Categoria'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Categories;
