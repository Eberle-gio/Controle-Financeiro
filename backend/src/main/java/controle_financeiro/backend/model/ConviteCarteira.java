package controle_financeiro.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "convites_carteira", uniqueConstraints = @UniqueConstraint(columnNames = {"carteira_id", "email"}))
@Data
@NoArgsConstructor
public class ConviteCarteira {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(optional = false) @JoinColumn(name = "carteira_id")
    private Carteira carteira;
    @Column(nullable = false, length = 254)
    private String email;
    @Enumerated(EnumType.STRING) @Column(nullable = false)
    private TipoPermissao papel;
    @Column(nullable = false, unique = true, length = 64)
    private String tokenHash;
    @Column(nullable = false)
    private LocalDateTime expiraEm;
    @Column(nullable = false)
    private LocalDateTime enviadoEm;
    private LocalDateTime aceitoEm;
    private boolean cancelado;
}
