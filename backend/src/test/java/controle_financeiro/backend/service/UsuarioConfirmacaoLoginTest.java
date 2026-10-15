package controle_financeiro.backend.service;

import controle_financeiro.backend.dto.LoginRequest;
import controle_financeiro.backend.exception.BusinessException;
import controle_financeiro.backend.model.Usuario;
import controle_financeiro.backend.repository.UsuarioRepository;
import controle_financeiro.backend.security.JwtUtils;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class UsuarioConfirmacaoLoginTest {
    private UsuarioService service;
    private Usuario usuario;
    private JwtUtils jwt;
    private LoginRequest request;

    @BeforeEach
    void setup() {
        service = new UsuarioService();
        UsuarioRepository usuarios = mock(UsuarioRepository.class);
        PasswordEncoder encoder = mock(PasswordEncoder.class);
        jwt = mock(JwtUtils.class);
        ReflectionTestUtils.setField(service, "usuarioRepository", usuarios);
        ReflectionTestUtils.setField(service, "passwordEncoder", encoder);
        ReflectionTestUtils.setField(service, "jwtUtils", jwt);
        usuario = new Usuario();
        usuario.setId(1L);
        usuario.setEmail("cliente@example.com");
        usuario.setNome("Cliente");
        usuario.setSenha("hash");
        request = new LoginRequest();
        request.setEmail(usuario.getEmail());
        request.setPassword("senha");
        when(usuarios.findByEmail(usuario.getEmail())).thenReturn(usuario);
        when(encoder.matches("senha", "hash")).thenReturn(true);
        when(jwt.gerarToken(1L, usuario.getEmail(), "Cliente")).thenReturn("jwt");
        when(jwt.getExpirationSeconds()).thenReturn(604800L);
    }

    @Test
    void cadastroPendenteNaoRecebeJwt() {
        usuario.setEmailConfirmado(false);
        assertThrows(BusinessException.class, () -> service.login(request));
        verifyNoInteractions(jwt);
    }

    @Test
    void contaConfirmadaPodeEntrar() {
        usuario.setEmailConfirmado(true);
        var response = service.login(request);
        assertEquals("jwt", response.getAccessToken());
        assertEquals(604800L, response.getExpiresIn());
    }

    @Test
    void contaAntigaSemConfirmacaoTambemNaoRecebeJwt() {
        usuario.setEmailConfirmado(null);
        assertThrows(BusinessException.class, () -> service.login(request));
        verifyNoInteractions(jwt);
    }
}
