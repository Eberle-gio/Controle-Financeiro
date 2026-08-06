package controle_financeiro.backend.controller;

import controle_financeiro.backend.dto.CategoryRequest;
import controle_financeiro.backend.dto.CategoryResponse;
import controle_financeiro.backend.model.Usuario;
import controle_financeiro.backend.service.CategoriaService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping({"/api/v1/categories", "/api/categorias"})
public class CategoriaController {

    @Autowired
    private CategoriaService categoriaService;

    // GET /api/v1/categories (com suporte a filtro ?type=INCOME ou ?type=EXPENSE)
    @GetMapping
    public ResponseEntity<List<CategoryResponse>> listar(@AuthenticationPrincipal Usuario usuario,
                                                          @RequestParam(required = false) String type) {
        List<CategoryResponse> categorias = categoriaService.listarPorUsuario(usuario, type);
        return ResponseEntity.ok(categorias);
    }

    // POST /api/v1/categories
    @PostMapping
    public ResponseEntity<CategoryResponse> criar(@AuthenticationPrincipal Usuario usuario,
                                                  @Valid @RequestBody CategoryRequest request) {
        CategoryResponse salva = categoriaService.criar(request, usuario);
        return ResponseEntity.status(HttpStatus.CREATED).body(salva);
    }

    // PUT /api/v1/categories/{id}
    @PutMapping("/{id}")
    public ResponseEntity<CategoryResponse> atualizar(@AuthenticationPrincipal Usuario usuario,
                                                      @PathVariable Long id,
                                                      @Valid @RequestBody CategoryRequest request) {
        CategoryResponse atualizada = categoriaService.atualizar(id, request, usuario);
        return ResponseEntity.ok(atualizada);
    }

    // DELETE /api/v1/categories/{id} (retorna 422 caso existam transações vinculadas)
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@AuthenticationPrincipal Usuario usuario,
                                         @PathVariable Long id) {
        categoriaService.excluir(id, usuario);
        return ResponseEntity.noContent().build();
    }
}
