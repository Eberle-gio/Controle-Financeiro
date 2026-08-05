package controle_financeiro.backend.service;

import controle_financeiro.backend.dto.ResumoCarteiraDTO;
import controle_financeiro.backend.model.Carteira;
import controle_financeiro.backend.model.TipoMovimentacao;
import controle_financeiro.backend.model.Transacao;
import controle_financeiro.backend.model.Usuario;
import controle_financeiro.backend.repository.CarteiraRepository;
import controle_financeiro.backend.repository.MembroCarteiraRepository;
import controle_financeiro.backend.repository.TransacaoRepository;
import controle_financeiro.backend.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

@Service
public class TransacaoService {

    @Autowired
    private TransacaoRepository transacaoRepository;

    @Autowired
    private CarteiraRepository carteiraRepository;

    @Autowired
    private MembroCarteiraRepository membroCarteiraRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    // Cria uma nova transação validando se o usuário é membro da carteira
    public Transacao criar(Transacao transacao, Long carteiraId, Long usuarioId) {
        Carteira carteira = carteiraRepository.findById(carteiraId).orElse(null);
        if (carteira == null) {
            throw new RuntimeException("Carteira não encontrada.");
        }

        Usuario usuario = usuarioRepository.findById(usuarioId).orElse(null);
        if (usuario == null) {
            throw new RuntimeException("Usuário não encontrado.");
        }

        if (!membroCarteiraRepository.existsByCarteiraAndUsuario(carteira, usuario)) {
            throw new RuntimeException("Acesso negado: usuário não é membro desta carteira.");
        }

        transacao.setCarteira(carteira);
        transacao.setCriadoPor(usuario);
        return transacaoRepository.save(transacao);
    }

    // Retorna o resumo completo da carteira para o Dashboard
    public ResumoCarteiraDTO gerarResumo(Long carteiraId, Long usuarioId, LocalDate inicio, LocalDate fim) {
        Carteira carteira = carteiraRepository.findById(carteiraId).orElse(null);
        if (carteira == null) {
            throw new RuntimeException("Carteira não encontrada.");
        }

        Usuario usuario = usuarioRepository.findById(usuarioId).orElse(null);
        if (usuario == null || !membroCarteiraRepository.existsByCarteiraAndUsuario(carteira, usuario)) {
            throw new RuntimeException("Acesso negado: usuário não é membro desta carteira.");
        }

        // Busca transações do período e calcula totais via queries do repositório
        List<Transacao> transacoes = transacaoRepository
                .findByCarteiraAndDataBetweenOrderByDataDesc(carteira, inicio, fim);

        BigDecimal totalIncome  = transacaoRepository.somarPorTipo(carteira, TipoMovimentacao.RECEITA, inicio, fim);
        BigDecimal totalExpense = transacaoRepository.somarPorTipo(carteira, TipoMovimentacao.DESPESA, inicio, fim);
        BigDecimal balance = totalIncome.subtract(totalExpense);

        // Agrupa por categoria
        Map<Long, Map<String, Object>> byCategoryMap = new LinkedHashMap<>();
        for (Transacao t : transacoes) {
            Long catId = t.getCategoria() != null ? t.getCategoria().getId() : 0L;
            String catName = t.getCategoria() != null ? t.getCategoria().getName() : "Outros";

            byCategoryMap.putIfAbsent(catId, new LinkedHashMap<>(Map.of(
                "categoryId", catId,
                "categoryName", catName,
                "total", BigDecimal.ZERO
            )));
            BigDecimal totalAtual = (BigDecimal) byCategoryMap.get(catId).get("total");
            byCategoryMap.get(catId).put("total", totalAtual.add(t.getValor()));
        }

        // Agrupa por data para o gráfico
        Map<String, Map<String, Object>> byDateMap = new TreeMap<>();
        for (Transacao t : transacoes) {
            String dateKey = t.getData().toString();
            byDateMap.putIfAbsent(dateKey, new LinkedHashMap<>(Map.of(
                "date", dateKey,
                "receitas", BigDecimal.ZERO,
                "despesas", BigDecimal.ZERO
            )));
            BigDecimal valor = t.getValor();
            if (TipoMovimentacao.RECEITA == t.getTipo()) {
                BigDecimal atual = (BigDecimal) byDateMap.get(dateKey).get("receitas");
                byDateMap.get(dateKey).put("receitas", atual.add(valor));
            } else {
                BigDecimal atual = (BigDecimal) byDateMap.get(dateKey).get("despesas");
                byDateMap.get(dateKey).put("despesas", atual.add(valor));
            }
        }

        // Monta as últimas 10 transações enriquecidas com dados da categoria
        List<Map<String, Object>> recentTransactions = transacoes.stream()
                .limit(10)
                .map(t -> {
                    Map<String, Object> item = new LinkedHashMap<>();
                    item.put("id", t.getId());
                    item.put("tipo", t.getTipo());
                    item.put("valor", t.getValor());
                    item.put("descricao", t.getDescricao());
                    item.put("date", t.getData().toString());
                    item.put("categoryName", t.getCategoria() != null ? t.getCategoria().getName() : "Sem Categoria");
                    item.put("categoryColor", t.getCategoria() != null ? t.getCategoria().getCor() : "#6b7280");
                    item.put("categoryIcon", t.getCategoria() != null ? t.getCategoria().getIcone() : "📝");
                    return item;
                })
                .toList();

        return new ResumoCarteiraDTO(
                totalIncome,
                totalExpense,
                balance,
                transacoes.size(),
                new ArrayList<>(byCategoryMap.values()),
                new ArrayList<>(byDateMap.values()),
                recentTransactions
        );
    }
}
