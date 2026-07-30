package controle_financeiro.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "membros_carteira")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MembroCarteira {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "carteira_id", nullable = false)
    private Carteira carteira;

    @ManyToOne
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    // Papel do membro na carteira: DONO ou MEMBRO
    @Column(nullable = false)
    private String papel;

    @Column(name = "entrado_em", nullable = false, updatable = false)
    private LocalDateTime entradoEm;

    @PrePersist
    protected void onCreate() {
        entradoEm = LocalDateTime.now();
    }
}
