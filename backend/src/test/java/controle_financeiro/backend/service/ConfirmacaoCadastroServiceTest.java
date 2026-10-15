package controle_financeiro.backend.service;

import controle_financeiro.backend.model.Usuario;
import controle_financeiro.backend.repository.UsuarioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.context.ApplicationEventPublisher;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class ConfirmacaoCadastroServiceTest {
    private UsuarioRepository usuarios;
    private ApplicationEventPublisher events;
    private ConfirmacaoCadastroService service;

    @BeforeEach
    void setup() {
        usuarios = mock(UsuarioRepository.class);
        events = mock(ApplicationEventPublisher.class);
        service = new ConfirmacaoCadastroService(usuarios, events, "http://localhost:5173/");
    }

    private Usuario pendente() {
        Usuario usuario = new Usuario();
        usuario.setEmail("cliente@example.com");
        usuario.setNome("Cliente");
        usuario.setEmailConfirmado(false);
        usuario.setConfirmacaoExpiraEm(LocalDateTime.now().plusHours(24));
        return usuario;
    }

    @Test
    void geraLinkAleatorioArmazenaSomenteHashEAgendaEmail() {
        Usuario usuario = pendente();
        service.prepararEnvio(usuario);
        ArgumentCaptor<Object> captor = ArgumentCaptor.forClass(Object.class);
        verify(events).publishEvent(captor.capture());
        var evento = (ConfirmacaoCadastroService.CadastroPendente) captor.getValue();
        assertTrue(evento.confirmUrl().startsWith("http://localhost:5173/confirmar-cadastro/"));
        String token = evento.confirmUrl().substring(evento.confirmUrl().lastIndexOf('/') + 1);
        assertTrue(token.matches("[a-f0-9]{64}"));
        assertNotEquals(token, usuario.getConfirmacaoTokenHash());
        assertEquals(ConfirmacaoCadastroService.hash(token), usuario.getConfirmacaoTokenHash());
        assertTrue(usuario.getConfirmacaoExpiraEm().isAfter(LocalDateTime.now().plusHours(23)));
        assertEquals(false, usuario.getEmailConfirmado());
    }

    @Test
    void confirmaContaEInvalidaToken() {
        Usuario usuario = pendente();
        String token = "a".repeat(64);
        when(usuarios.buscarPorConfirmacaoToken(ConfirmacaoCadastroService.hash(token))).thenReturn(Optional.of(usuario));
        service.confirmar(token);
        assertEquals(true, usuario.getEmailConfirmado());
        assertNull(usuario.getConfirmacaoTokenHash());
        assertNull(usuario.getConfirmacaoExpiraEm());
        verify(usuarios).save(usuario);
    }

    @Test
    void rejeitaTokenExpiradoSemAtivarConta() {
        Usuario usuario = pendente();
        usuario.setConfirmacaoExpiraEm(LocalDateTime.now().minusSeconds(1));
        when(usuarios.buscarPorConfirmacaoToken(anyString())).thenReturn(Optional.of(usuario));
        assertThrows(IllegalArgumentException.class, () -> service.confirmar("a".repeat(64)));
        assertEquals(false, usuario.getEmailConfirmado());
        verify(usuarios, never()).save(any());
    }

    @Test
    void rejeitaTokenInvalidoOuJaUtilizado() {
        assertThrows(IllegalArgumentException.class, () -> service.confirmar("invalido"));
        verifyNoInteractions(usuarios);
        when(usuarios.buscarPorConfirmacaoToken(anyString())).thenReturn(Optional.empty());
        assertThrows(IllegalArgumentException.class, () -> service.confirmar("a".repeat(64)));
    }

    @Test
    void reenvioRespeitaIntervaloEInvalidaLinkAnterior() {
        Usuario usuario = pendente();
        usuario.setConfirmacaoTokenHash("hash-anterior");
        usuario.setConfirmacaoEnviadaEm(LocalDateTime.now());
        when(usuarios.buscarParaConfirmacaoPorEmail(usuario.getEmail())).thenReturn(Optional.of(usuario));
        service.reenviar(usuario.getEmail());
        verifyNoInteractions(events);
        usuario.setConfirmacaoEnviadaEm(LocalDateTime.now().minusMinutes(2));
        service.reenviar(usuario.getEmail());
        assertNotEquals("hash-anterior", usuario.getConfirmacaoTokenHash());
        verify(events).publishEvent(any(Object.class));
    }

    @Test
    void naoReenviaParaContaConfirmadaOuInexistente() {
        Usuario usuario = pendente();
        when(usuarios.buscarParaConfirmacaoPorEmail(usuario.getEmail())).thenReturn(Optional.of(usuario));
        usuario.setEmailConfirmado(true);
        service.reenviar(usuario.getEmail());
        when(usuarios.buscarParaConfirmacaoPorEmail(usuario.getEmail())).thenReturn(Optional.empty());
        service.reenviar(usuario.getEmail());
        verifyNoInteractions(events);
    }

    @Test
    void contaAntigaSemConfirmacaoPodeSolicitarLink() {
        Usuario usuario = pendente();
        usuario.setEmailConfirmado(null);
        when(usuarios.buscarParaConfirmacaoPorEmail(usuario.getEmail())).thenReturn(Optional.of(usuario));
        service.reenviar(usuario.getEmail());
        assertEquals(false, usuario.getEmailConfirmado());
        verify(events).publishEvent(any(Object.class));
    }
}
