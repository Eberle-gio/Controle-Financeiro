package controle_financeiro.backend.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "transacoes")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Transacao {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "carteira_id", nullable = false)
    private Carteira carteira;

    @ManyToOne
    @JoinColumn(name = "categoria_id")
    private Categoria categoria;

    @ManyToOne
    @JoinColumn(name = "criado_por", nullable = false)
    private Usuario criadoPor;

    // Tipo da transação: RECEITA ou DESPESA
    @NotNull(message = "O tipo é obrigatório")
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TipoMovimentacao tipo;

    @NotNull(message = "O valor é obrigatório")
    @DecimalMin(value = "0.01", message = "O valor deve ser maior que zero")
    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal valor;

    @NotBlank(message = "A descrição é obrigatória")
    @Column(nullable = false)
    private String descricao;

    // Data da transação (quando ocorreu de fato, não quando foi registrada)
    @NotNull(message = "A data é obrigatória")
    @Column(nullable = false)
    private LocalDate data;

    @Column(name = "criado_em", nullable = false, updatable = false)
    private LocalDateTime criadoEm;

    @PrePersist
    protected void onCreate() {
        criadoEm = LocalDateTime.now();
    }
}
