package controle_financeiro.backend.service;

import controle_financeiro.backend.dto.TransactionRequest;
import controle_financeiro.backend.model.*;
import controle_financeiro.backend.repository.*;
import controle_financeiro.backend.exception.BusinessException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.test.util.ReflectionTestUtils;
import java.util.Optional;
import java.time.LocalDate;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.*;

class TransacaoConsistencyTest {
    private TransacaoService service;
    private CategoriaRepository categorias;
    private TransacaoRepository transacoes;
    private Categoria categoria;
    private TransactionRequest request;

    @BeforeEach
    void setup() {
        service = new TransacaoService();
        categorias = mock(CategoriaRepository.class);
        transacoes = mock(TransacaoRepository.class);
        var usuarios = mock(UsuarioService.class);
        var carteiras = mock(CarteiraService.class);
        ReflectionTestUtils.setField(service, "categoriaRepository", categorias);
        ReflectionTestUtils.setField(service, "transacaoRepository", transacoes);
        ReflectionTestUtils.setField(service, "usuarioService", usuarios);
        ReflectionTestUtils.setField(service, "carteiraService", carteiras);
        var usuario = new Usuario(); usuario.setId(1L);
        when(usuarios.getUsuarioAutenticado()).thenReturn(usuario);
        var vinculo = new MembroCarteira(); vinculo.setPapel(TipoPermissao.EDITOR);
        when(carteiras.buscarVinculoOuFalhar(2L, usuario)).thenReturn(vinculo);
        categoria = new Categoria(); categoria.setId(3L); categoria.setUsuario(usuario);
        categoria.setTipo(TipoMovimentacao.RECEITA);
        when(categorias.findById(3L)).thenReturn(Optional.of(categoria));
        request = new TransactionRequest(); request.setCategoryId(3L); request.setTipo(TipoMovimentacao.DESPESA);
    }

    @Test
    void rejeitaCategoriaComTipoDiferente() {
        assertThrows(BusinessException.class, () -> service.criar(2L, request));
        verify(transacoes, never()).save(any());
    }

    @Test
    void rejeitaCategoriaDeOutroUsuario() {
        var outro = new Usuario(); outro.setId(99L); categoria.setUsuario(outro);
        assertThrows(AccessDeniedException.class, () -> service.criar(2L, request));
        verify(transacoes, never()).save(any());
    }

    @Test
    void rejeitaPaginacaoOrdenacaoEPeriodoInvalidos() {
        assertThrows(IllegalArgumentException.class, () -> service.listarPaginado(2L, -1, 20, null, null, null, null, null));
        assertThrows(IllegalArgumentException.class, () -> service.listarPaginado(2L, 0, 20, "campoInexistente,desc", null, null, null, null));
        assertThrows(IllegalArgumentException.class, () -> service.obterResumoDashboard(2L, LocalDate.of(2026, 2, 1), LocalDate.of(2026, 1, 1)));
    }

    @Test
    void aceitaAliasDateComoDataParaCompatibilidade() {
        when(transacoes.findAll(any(Specification.class), any(Pageable.class))).thenReturn(Page.empty());
        service.listarPaginado(2L, 0, 20, "date,desc", null, null, null, null);
        verify(transacoes).findAll(any(Specification.class), argThat((Pageable p) -> p.getSort().getOrderFor("data") != null));
    }
}
