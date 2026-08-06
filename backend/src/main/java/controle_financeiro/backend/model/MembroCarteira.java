package controle_financeiro.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(
    name = "membros_carteira",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_carteira_usuario", columnNames = {"carteira_id", "usuario_id"})
    }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MembroCarteira {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "carteira_id", nullable = false)
    private Carteira carteira;

    @ManyToOne(optional = false)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TipoPermissao papel;

    @Column(name = "entrado_em", nullable = false, updatable = false)
    private LocalDateTime entradoEm;

    @PrePersist
    protected void onCreate() {
        entradoEm = LocalDateTime.now();
    }
}
