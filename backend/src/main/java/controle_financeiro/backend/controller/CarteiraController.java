package controle_financeiro.backend.controller;

import controle_financeiro.backend.model.Carteira;
import controle_financeiro.backend.service.CarteiraService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/carteiras")
@CrossOrigin(origins = "*")
public class CarteiraController {

    @Autowired
    private CarteiraService carteiraService;

    // POST /api/carteiras?usuarioId={id}
    // Cria uma nova carteira vinculada ao usuário informado
    @PostMapping
    public ResponseEntity<?> criar(@Valid @RequestBody Carteira carteira,
                                   @RequestParam Long usuarioId) {
        try {
            Carteira carteiraSalva = carteiraService.criarCarteira(carteira, usuarioId);
            return ResponseEntity.status(HttpStatus.CREATED).body(carteiraSalva);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    // GET /api/carteiras?usuarioId={id}
    // Lista todas as carteiras do usuário (onde ele é DONO ou MEMBRO)
    @GetMapping
    public ResponseEntity<?> listar(@RequestParam Long usuarioId) {
        try {
            List<Carteira> carteiras = carteiraService.listarCarteirasPorUsuario(usuarioId);
            return ResponseEntity.ok(carteiras);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    // GET /api/carteiras/{id}?usuarioId={id}
    // Busca uma carteira específica, validando se o usuário é membro
    @GetMapping("/{id}")
    public ResponseEntity<?> buscarPorId(@PathVariable Long id,
                                          @RequestParam Long usuarioId) {
        try {
            Carteira carteira = carteiraService.buscarCarteiraPorId(id, usuarioId);
            return ResponseEntity.ok(carteira);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        }
    }
}
