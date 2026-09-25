package controle_financeiro.backend.controller;

import controle_financeiro.backend.dto.CategoryRequest;
import controle_financeiro.backend.dto.CategoryResponse;
import controle_financeiro.backend.service.CategoriaService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/categories")
public class CategoriaController {

    @Autowired
    private CategoriaService categoriaService;

    // GET /api/v1/categories 
    @GetMapping
    public ResponseEntity<List<CategoryResponse>> listar(@RequestParam(required = false) String type) {
        List<CategoryResponse> categorias = categoriaService.listarPorUsuario(type);
        return ResponseEntity.ok(categorias);
    }

    // POST /api/v1/categories
    @PostMapping
    public ResponseEntity<CategoryResponse> criar(@Valid @RequestBody CategoryRequest request) {
        CategoryResponse salva = categoriaService.criar(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(salva);
    }

    // PUT /api/v1/categories/{id}
    @PutMapping("/{id}")
    public ResponseEntity<CategoryResponse> atualizar(@PathVariable Long id,
                                                      @Valid @RequestBody CategoryRequest request) {
        CategoryResponse atualizada = categoriaService.atualizar(id, request);
        return ResponseEntity.ok(atualizada);
    }

    // DELETE /api/v1/categories/{id} 
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable Long id) {
        categoriaService.excluir(id);
        return ResponseEntity.noContent().build();
    }
}
