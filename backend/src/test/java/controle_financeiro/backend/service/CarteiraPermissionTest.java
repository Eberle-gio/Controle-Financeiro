package controle_financeiro.backend.service;

import controle_financeiro.backend.model.*;
import controle_financeiro.backend.repository.*;
import controle_financeiro.backend.exception.BusinessException;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;
import java.util.Optional;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.*;

class CarteiraPermissionTest {
    @Test
    void exclusaoDeCarteiraComTransacoesPreservaCarteiraEMembros() {
        var service = new CarteiraService();
        var usuarios = mock(UsuarioService.class);
        var carteiras = mock(CarteiraRepository.class);
        var membros = mock(MembroCarteiraRepository.class);
        var transacoes = mock(TransacaoRepository.class);
        ReflectionTestUtils.setField(service, "usuarioService", usuarios);
        ReflectionTestUtils.setField(service, "carteiraRepository", carteiras);
        ReflectionTestUtils.setField(service, "membroCarteiraRepository", membros);
        ReflectionTestUtils.setField(service, "transacaoRepository", transacoes);
        var usuario = new Usuario(); usuario.setId(1L);
        var carteira = new Carteira(); carteira.setId(2L);
        var vinculo = new MembroCarteira(); vinculo.setCarteira(carteira); vinculo.setPapel(TipoPermissao.DONO);
        when(usuarios.getUsuarioAutenticado()).thenReturn(usuario);
        when(carteiras.findById(2L)).thenReturn(Optional.of(carteira));
        when(membros.findByCarteiraAndUsuario(carteira, usuario)).thenReturn(Optional.of(vinculo));
        when(transacoes.existsByCarteira(carteira)).thenReturn(true);
        assertThrows(BusinessException.class, () -> service.excluirCarteira(2L));
        verify(carteiras, never()).delete(any());
        verify(membros, never()).deleteByCarteira(any());
    }

    @Test
    void papelInvalidoNaoViraVisualizadorSilenciosamente() {
        assertThrows(IllegalArgumentException.class, () -> TipoPermissao.fromString("ADMIN"));
        assertThrows(IllegalArgumentException.class, () -> TipoPermissao.fromString(""));
    }

    @Test
    void naoPermitePromoverMembroADono() {
        assertThrows(BusinessException.class,
                () -> new CarteiraService().alterarPapelMembro(1L, 2L, TipoPermissao.DONO));
    }

}
