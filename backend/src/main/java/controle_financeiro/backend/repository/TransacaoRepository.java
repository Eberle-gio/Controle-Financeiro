package controle_financeiro.backend.repository;

import controle_financeiro.backend.model.Carteira;
import controle_financeiro.backend.model.TipoMovimentacao;
import controle_financeiro.backend.model.Transacao;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface TransacaoRepository extends JpaRepository<Transacao, Long> {

    // Busca todas as transações de uma carteira em um período
    List<Transacao> findByCarteiraAndDataBetweenOrderByDataDesc(
            Carteira carteira, LocalDate inicio, LocalDate fim);

    // Soma total de RECEITAS de uma carteira em um período
    @Query("SELECT COALESCE(SUM(t.valor), 0) FROM Transacao t " +
           "WHERE t.carteira = :carteira AND t.tipo = :tipo " +
           "AND t.data BETWEEN :inicio AND :fim")
    BigDecimal somarPorTipo(@Param("carteira") Carteira carteira,
                            @Param("tipo") TipoMovimentacao tipo,
                            @Param("inicio") LocalDate inicio,
                            @Param("fim") LocalDate fim);

    // Verifica se existem transações vinculadas a uma categoria
    boolean existsByCategoriaId(Long categoriaId);
}
