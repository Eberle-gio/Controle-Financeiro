package controle_financeiro.backend.service;

import controle_financeiro.backend.dto.ResetPasswordRequest;
import controle_financeiro.backend.model.*;
import controle_financeiro.backend.repository.*;
import controle_financeiro.backend.security.*;
import org.junit.jupiter.api.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.mock.web.*;
import jakarta.servlet.FilterChain;
import java.time.LocalDateTime;
import java.util.Optional;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class SenhaSessaoTest {
    UsuarioRepository usuarios = mock(UsuarioRepository.class);
    PasswordResetTokenRepository tokens = mock(PasswordResetTokenRepository.class);
    PasswordEncoder encoder = mock(PasswordEncoder.class);
    UsuarioService service = new UsuarioService();
    Usuario usuario = new Usuario();
    @BeforeEach void setup() {
        usuario.setId(1L); usuario.setEmail("cliente@example.com"); usuario.setNome("Cliente");
        usuario.setSenha("hash-antigo"); usuario.setEmailConfirmado(true);
        ReflectionTestUtils.setField(service, "usuarioRepository", usuarios);
        ReflectionTestUtils.setField(service, "resetTokenRepository", tokens);
        ReflectionTestUtils.setField(service, "passwordEncoder", encoder);
        ReflectionTestUtils.setField(service, "entityManager", mock(jakarta.persistence.EntityManager.class));
        when(usuarios.findByEmail(usuario.getEmail())).thenReturn(usuario);
        when(usuarios.buscarPorIdComBloqueio(1L)).thenReturn(Optional.of(usuario));
        when(encoder.encode("nova-senha")).thenReturn("hash-novo");
    }
    @AfterEach void clear() { SecurityContextHolder.clearContext(); }

    @Test void trocaInvalidaSessaoAnteriorETodosOsLinks() throws Exception {
        JwtUtils jwt = new JwtUtils();
        ReflectionTestUtils.setField(jwt, "jwtSecret", "chave-de-teste-com-pelo-menos-32-bytes");
        ReflectionTestUtils.setField(jwt, "jwtExpirationMs", 60_000L); jwt.init();
        String antigo = jwt.gerarToken(1L, usuario.getEmail(), usuario.getNome(), 0L);
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(usuario.getEmail(), null, java.util.List.of()));
        when(encoder.matches("senha-atual", "hash-antigo")).thenReturn(true);
        service.alterarSenha("senha-atual", "nova-senha");
        assertEquals(1L, usuario.getVersaoSessao()); verify(tokens).invalidarTodos(usuario);
        var filter = new JwtAuthenticationFilter();
        ReflectionTestUtils.setField(filter, "jwtUtils", jwt); ReflectionTestUtils.setField(filter, "usuarioRepository", usuarios);
        SecurityContextHolder.clearContext(); var request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer " + antigo);
        filter.doFilter(request, new MockHttpServletResponse(), mock(FilterChain.class));
        assertNull(SecurityContextHolder.getContext().getAuthentication());
        String novo = jwt.gerarToken(1L, usuario.getEmail(), usuario.getNome(), usuario.getVersaoSessao());
        request = new MockHttpServletRequest(); request.addHeader("Authorization", "Bearer " + novo);
        filter.doFilter(request, new MockHttpServletResponse(), mock(FilterChain.class));
        assertNotNull(SecurityContextHolder.getContext().getAuthentication());
    }

    PasswordResetToken reset() {
        var token = new PasswordResetToken(); token.setUsuario(usuario); token.setToken("reset");
        token.setExpiraEm(LocalDateTime.now().plusHours(1));
        when(tokens.findByToken("reset")).thenReturn(Optional.of(token)); return token;
    }
    @Test void redefinicaoInvalidaTodosOsLinksESessoes() {
        reset(); service.redefinirSenha(new ResetPasswordRequest("reset", "nova-senha"));
        assertEquals("hash-novo", usuario.getSenha()); assertEquals(1L, usuario.getVersaoSessao());
        verify(tokens).invalidarTodos(usuario);
    }
    @Test void reutilizacaoConcorrenteDetectadaAposBloqueio() {
        reset(); when(tokens.existsByTokenAndUtilizadoTrue("reset")).thenReturn(true);
        assertThrows(IllegalArgumentException.class, () -> service.redefinirSenha(new ResetPasswordRequest("reset", "nova-senha")));
        verify(usuarios, never()).save(any());
    }
}
