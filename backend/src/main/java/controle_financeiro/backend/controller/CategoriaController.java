package controle_financeiro.backend.controller;

import controle_financeiro.backend.model.Categoria;
import controle_financeiro.backend.service.CategoriaService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/categorias")
@CrossOrigin(origins = "*")
public class CategoriaController {

    @Autowired
    private CategoriaService categoriaService;

    // GET /api/categorias?usuarioId={id}
    // GET /api/categorias?usuarioId={id}&tipo=RECEITA  (filtro opcional)
    @GetMapping
    public ResponseEntity<?> listar(@RequestParam Long usuarioId,
                                     @RequestParam(required = false) String tipo) {
        try {
            List<Categoria> categorias = categoriaService.listarPorUsuario(usuarioId, tipo);
            return ResponseEntity.ok(categorias);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    // POST /api/categorias?usuarioId={id}
    @PostMapping
    public ResponseEntity<?> criar(@Valid @RequestBody Categoria categoria,
                                    @RequestParam Long usuarioId) {
        try {
            Categoria categoriaSalva = categoriaService.criar(categoria, usuarioId);
            return ResponseEntity.status(HttpStatus.CREATED).body(categoriaSalva);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }
}
