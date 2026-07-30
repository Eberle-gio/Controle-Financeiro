package controle_financeiro.backend.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "categorias")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Categoria {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @NotBlank(message = "O nome da categoria é obrigatório")
    @Size(max = 100, message = "O nome deve ter no máximo 100 caracteres")
    @Column(nullable = false)
    private String name;

    // Tipo da categoria: RECEITA ou DESPESA
    @NotNull(message = "O tipo é obrigatório")
    @Column(nullable = false)
    private String tipo;

    // Cor em formato hexadecimal (ex: #10b981)
    @Size(max = 7)
    private String cor;

    // Ícone (emoji ou código) para exibição no frontend
    @Size(max = 10)
    private String icone;
}
