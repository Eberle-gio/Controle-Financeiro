import { useState, useEffect } from 'react';
import { X, Trash2, Check, AlertCircle, Wallet } from 'lucide-react';
import { transactionService } from '../services/transactionService';
import { categoryService } from '../services/categoryService';
import { walletService } from '../services/walletService';
import CategoryIcon from './CategoryIcon';
import { localDate } from '../utils/localDate';
import './TransactionModal.css';

const TransactionModal = ({
  isOpen,
  onClose,
  onSuccess,
  walletId,
  wallets = [],
  onWalletChange,
  initialData = null
}) => {
  const isEditing = Boolean(initialData);

  const [selectedWalletId, setSelectedWalletId] = useState(() => {
    return walletId ? String(walletId) : (wallets[0]?.id ? String(wallets[0].id) : '');
  });
  const [tipo, setTipo] = useState('DESPESA');
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const [data, setData] = useState('');
  const [categoryId, setCategoryId] = useState('');

  const [categorias, setCategorias] = useState([]);
  const [carregandoCategorias, setCarregandoCategorias] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);
  const [erro, setErro] = useState('');

  // Atualiza selectedWalletId quando prop muda
  useEffect(() => {
    if (walletId) {
      setSelectedWalletId(String(walletId));
    } else if (wallets.length > 0) {
      setSelectedWalletId(String(wallets[0].id));
    }
  }, [walletId, wallets]);

  // Sincroniza formulário quando modal abre ou transação selecionada muda
  useEffect(() => {
    if (!isOpen) return;

    setErro('');
    setConfirmandoExclusao(false);

    if (initialData) {
      setTipo(initialData.tipo || 'DESPESA');
      setDescricao(initialData.descricao || '');
      setValor(initialData.valor != null ? String(initialData.valor) : '');
      setData(initialData.data || localDate());
      setCategoryId(initialData.categoryId ? String(initialData.categoryId) : '');
      if (initialData.walletId) {
        setSelectedWalletId(String(initialData.walletId));
      }
    } else {
      setTipo('DESPESA');
      setDescricao('');
      setValor('');
      setData(localDate());
      setCategoryId('');
    }
  }, [isOpen, initialData]);

  // Carrega categorias de acordo com o tipo selecionado (RECEITA ou DESPESA)
  useEffect(() => {
    if (!isOpen) return;

    const carregarCategorias = async () => {
      setCarregandoCategorias(true);
      try {
        const lista = await categoryService.listarCategorias(tipo);
        if (initialData?.categoryId && initialData.tipo === tipo
            && !lista.some(category => category.id === initialData.categoryId)) {
          lista.push({ id: initialData.categoryId, name: initialData.categoryName, tipo });
        }
        setCategorias(lista);
      } catch (err) {
        console.error('Falha ao carregar categorias:', err);
      } finally {
        setCarregandoCategorias(false);
      }
    };

    carregarCategorias();
  }, [isOpen, tipo, initialData]);

  // Fechar com tecla ESC
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');

    if (!descricao.trim()) {
      setErro('Informe uma descrição para a transação.');
      return;
    }

    const valorNumerico = parseFloat(valor.toString().replace(',', '.'));
    if (isNaN(valorNumerico) || valorNumerico <= 0) {
      setErro('Informe um valor válido e maior que zero.');
      return;
    }

    if (!data) {
      setErro('Informe uma data válida.');
      return;
    }

    setSalvando(true);
    try {
      let finalWalletId = selectedWalletId || walletId;
      if (!finalWalletId) {
        if (wallets.length > 0) {
          finalWalletId = wallets[0].id;
        } else {
          // Cria carteira padrão se o usuário ainda não tiver nenhuma
          const novaCarteira = await walletService.garantirCarteiraPadrao();
          finalWalletId = novaCarteira.id;
          onWalletChange?.(novaCarteira);
        }
      }

      const payload = {
        descricao: descricao.trim(),
        valor: valorNumerico,
        tipo,
        data,
        categoryId: categoryId ? Number(categoryId) : null
      };

      if (isEditing) {
        await transactionService.atualizarTransacao(finalWalletId, initialData.id, payload);
      } else {
        await transactionService.criarTransacao(finalWalletId, payload);
      }
      onSuccess?.();
      onClose();
    } catch (err) {
      setErro(err.message || 'Falha ao salvar a transação.');
    } finally {
      setSalvando(false);
    }
  };

  const handleExcluir = async () => {
    if (!isEditing || !initialData?.id) return;

    setExcluindo(true);
    setErro('');
    try {
      const finalWalletId = selectedWalletId || walletId || initialData.walletId;
      await transactionService.excluirTransacao(finalWalletId, initialData.id);
      onSuccess?.();
      onClose();
    } catch (err) {
      setErro(err.message || 'Falha ao excluir a transação.');
      setConfirmandoExclusao(false);
    } finally {
      setExcluindo(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <header className="modal-header">
          <h2>{isEditing ? 'Editar Transação' : 'Nova Transação'}</h2>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Fechar"
          >
            <X size={20} />
          </button>
        </header>

        {erro && (
          <div className="modal-error-alert">
            <AlertCircle size={18} />
            <span>{erro}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="modal-form">
          {/* Seletor Tipo: Receita x Despesa */}
          <div className="type-toggle-group">
            <button
              type="button"
              className={`type-toggle-btn expense ${tipo === 'DESPESA' ? 'active' : ''}`}
              onClick={() => {
                setTipo('DESPESA');
                setCategoryId('');
              }}
            >
              Despesa
            </button>
            <button
              type="button"
              className={`type-toggle-btn income ${tipo === 'RECEITA' ? 'active' : ''}`}
              onClick={() => {
                setTipo('RECEITA');
                setCategoryId('');
              }}
            >
              Receita
            </button>
          </div>

          {/* Seletor de Carteira se houver mais de uma */}
          {wallets.length > 1 && (
            <div className="form-group">
              <label htmlFor="tx-wallet">Carteira*</label>
              <select
                id="tx-wallet"
                value={selectedWalletId}
                disabled={isEditing}
                onChange={(e) => {
                  setSelectedWalletId(e.target.value);
                  const found = wallets.find(w => w.id === Number(e.target.value));
                  if (found) onWalletChange?.(found);
                }}
                required
              >
                {wallets.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.nome} {w.meuPapel ? `(${w.meuPapel})` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Campo Valor */}
          <div className="form-group">
            <label htmlFor="tx-valor">Valor (R$)*</label>
            <div className="input-prefix-wrapper">
              <span className="input-prefix">R$</span>
              <input
                id="tx-valor"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0,00"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                required
                autoFocus
              />
            </div>
          </div>

          {/* Campo Descrição */}
          <div className="form-group">
            <label htmlFor="tx-descricao">Descrição*</label>
            <input
              id="tx-descricao"
              type="text"
              placeholder="Ex: Mercado, Salário, Internet..."
              maxLength={255}
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              required
            />
          </div>

          <div className="form-row">
            {/* Campo Data */}
            <div className="form-group">
              <label htmlFor="tx-data">Data*</label>
              <input
                id="tx-data"
                type="date"
                value={data}
                onChange={(e) => setData(e.target.value)}
                required
              />
            </div>

            {/* Campo Categoria */}
            <div className="form-group">
              <label htmlFor="tx-categoria">Categoria</label>
              <div className="category-select-wrapper">
                <select
                  id="tx-categoria"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  disabled={carregandoCategorias}
                >
                  <option value="">Sem Categoria</option>
                  {categorias.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Ações do Modal */}
          <div className="modal-actions">
            {isEditing && (
              <div className="modal-delete-wrapper">
                {confirmandoExclusao ? (
                  <div className="confirm-delete-box">
                    <span>Excluir?</span>
                    <button
                      type="button"
                      className="btn-danger-confirm"
                      onClick={handleExcluir}
                      disabled={excluindo}
                    >
                      {excluindo ? '...' : 'Sim, excluir'}
                    </button>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => setConfirmandoExclusao(false)}
                      disabled={excluindo}
                    >
                      Não
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="btn-delete"
                    onClick={() => setConfirmandoExclusao(true)}
                    title="Excluir Transação"
                  >
                    <Trash2 size={18} />
                    <span>Excluir</span>
                  </button>
                )}
              </div>
            )}

            <div className="modal-right-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={onClose}
                disabled={salvando || excluindo}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className={`btn-primary ${tipo === 'RECEITA' ? 'submit-income' : 'submit-expense'}`}
                disabled={salvando || excluindo}
              >
                {salvando ? (
                  'Salvando...'
                ) : (
                  <>
                    <Check size={18} />
                    {isEditing ? 'Atualizar' : 'Salvar Transação'}
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TransactionModal;
