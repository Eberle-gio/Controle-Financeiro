package controle_financeiro.backend.service;

import controle_financeiro.backend.model.Usuario;
import controle_financeiro.backend.repository.UsuarioRepository;
import controle_financeiro.backend.security.JwtAuthenticationFilter;
import controle_financeiro.backend.security.JwtUtils;
import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class ConfirmacaoSessaoTest {
    @AfterEach
    void limpar() { SecurityContextHolder.clearContext(); }

    private void executar(Boolean confirmado) throws Exception {
        var jwt = mock(JwtUtils.class);
        var usuarios = mock(UsuarioRepository.class);
        var usuario = new Usuario();
        usuario.setEmailConfirmado(confirmado);
        when(jwt.validarToken("token")).thenReturn(true);
        when(jwt.obterEmailDoToken("token")).thenReturn("cliente@example.com");
        when(usuarios.findByEmail("cliente@example.com")).thenReturn(usuario);
        var filter = new JwtAuthenticationFilter();
        ReflectionTestUtils.setField(filter, "jwtUtils", jwt);
        ReflectionTestUtils.setField(filter, "usuarioRepository", usuarios);
        var request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer token");
        filter.doFilter(request, new MockHttpServletResponse(), mock(FilterChain.class));
    }

    @Test
    void jwtExistenteNaoAutorizaContaPendente() throws Exception {
        executar(false);
        assertNull(SecurityContextHolder.getContext().getAuthentication());
    }

    @Test
    void jwtExistenteNaoAutorizaContaSemStatus() throws Exception {
        executar(null);
        assertNull(SecurityContextHolder.getContext().getAuthentication());
    }

    @Test
    void contaConfirmadaPodeUsarJwt() throws Exception {
        executar(true);
        assertNotNull(SecurityContextHolder.getContext().getAuthentication());
    }
}
