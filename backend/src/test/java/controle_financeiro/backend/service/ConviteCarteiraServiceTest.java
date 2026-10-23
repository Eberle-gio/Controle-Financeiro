package controle_financeiro.backend.service;

import controle_financeiro.backend.dto.WalletMemberRequest;
import controle_financeiro.backend.exception.*;
import controle_financeiro.backend.model.*;
import controle_financeiro.backend.repository.*;
import org.junit.jupiter.api.*;
import org.mockito.ArgumentCaptor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.access.AccessDeniedException;
import java.time.LocalDateTime;
import java.util.Optional;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class ConviteCarteiraServiceTest {
    ConviteCarteiraRepository convites = mock(ConviteCarteiraRepository.class);
    CarteiraRepository carteiras = mock(CarteiraRepository.class);
    MembroCarteiraRepository membros = mock(MembroCarteiraRepository.class);
    UsuarioRepository usuarios = mock(UsuarioRepository.class);
    UsuarioService autenticacao = mock(UsuarioService.class);
    ApplicationEventPublisher events = mock(ApplicationEventPublisher.class);
    ConviteCarteiraService service = new ConviteCarteiraService(convites, carteiras, membros, usuarios, autenticacao, events, "https://nodebank.example/");
    Usuario dono = new Usuario(), convidado = new Usuario();
    Carteira carteira = new Carteira();
    String token = "a".repeat(64);

    @BeforeEach void setup() {
        dono.setId(1L); dono.setNome("Dono"); dono.setEmail("dono@example.com");
        convidado.setId(2L); convidado.setEmail("cliente@example.com"); convidado.setEmailConfirmado(true);
        carteira.setId(3L); carteira.setNome("Casa"); carteira.setDono(dono);
        when(autenticacao.getUsuarioAutenticado()).thenReturn(dono);
        when(carteiras.buscarComBloqueio(3L)).thenReturn(Optional.of(carteira));
    }

    ConviteCarteira pendente() {
        ConviteCarteira convite = new ConviteCarteira();
        convite.setId(4L); convite.setCarteira(carteira); convite.setEmail(convidado.getEmail());
        convite.setPapel(TipoPermissao.EDITOR); convite.setTokenHash(ConfirmacaoCadastroService.hash(token));
        convite.setExpiraEm(LocalDateTime.now().plusDays(7)); convite.setEnviadoEm(LocalDateTime.now().minusMinutes(2));
        when(convites.findByTokenHash(convite.getTokenHash())).thenReturn(Optional.of(convite));
        when(convites.buscarCarteiraIdPorHash(convite.getTokenHash())).thenReturn(Optional.of(3L));
        when(convites.buscarComBloqueio(convite.getTokenHash())).thenReturn(Optional.of(convite));
        return convite;
    }

    @Test void convidaEmailSemCadastroSemCriarMembroENaoRetornaToken() {
        var result = service.convidar(3L, new WalletMemberRequest(" CLIENTE@example.com ", TipoPermissao.EDITOR));
        assertEquals("cliente@example.com", result.email()); assertEquals("PENDENTE", result.status());
        var saved = ArgumentCaptor.forClass(ConviteCarteira.class); verify(convites).save(saved.capture());
        var event = ArgumentCaptor.forClass(ConviteCarteiraService.ConvitePendente.class); verify(events).publishEvent(event.capture());
        String raw = event.getValue().link().substring(event.getValue().link().lastIndexOf('/') + 1);
        assertEquals(64, raw.length()); assertNotEquals(raw, saved.getValue().getTokenHash());
        assertEquals(ConfirmacaoCadastroService.hash(raw), saved.getValue().getTokenHash());
        assertTrue(event.getValue().link().startsWith("https://nodebank.example/convites/"));
        verify(membros, never()).save(any());
    }

    @Test void contaExistenteTambemPrecisaAceitar() {
        when(usuarios.findByEmail(convidado.getEmail())).thenReturn(convidado);
        service.convidar(3L, new WalletMemberRequest(convidado.getEmail(), TipoPermissao.VISUALIZADOR));
        verify(membros, never()).save(any());
    }

    @Test void somenteDonoPodeConvidar() {
        when(autenticacao.getUsuarioAutenticado()).thenReturn(convidado);
        assertThrows(AccessDeniedException.class, () -> service.convidar(3L, new WalletMemberRequest(convidado.getEmail(), TipoPermissao.EDITOR)));
        verifyNoInteractions(events); verify(convites, never()).save(any());
    }

    @Test void naoPermiteConviteComPapelDono() {
        assertThrows(BusinessException.class, () -> service.convidar(3L, new WalletMemberRequest(convidado.getEmail(), TipoPermissao.DONO)));
    }

    @Test void rejeitaPessoaQueJaEMembro() {
        when(usuarios.findByEmail(convidado.getEmail())).thenReturn(convidado);
        when(membros.existsByCarteiraAndUsuario(carteira, convidado)).thenReturn(true);
        assertThrows(BusinessException.class, () -> service.convidar(3L, new WalletMemberRequest(convidado.getEmail(), TipoPermissao.EDITOR)));
    }

    @Test void aceiteCriaVinculoApenasParaEmailConfirmadoDoConvite() {
        var convite = pendente(); when(autenticacao.getUsuarioAutenticado()).thenReturn(convidado);
        assertEquals("ACEITO", service.aceitar(token).status());
        var saved = ArgumentCaptor.forClass(MembroCarteira.class); verify(membros).save(saved.capture());
        assertEquals(convidado, saved.getValue().getUsuario()); assertEquals(TipoPermissao.EDITOR, saved.getValue().getPapel());
        assertNotNull(convite.getAceitoEm());
        assertThrows(BusinessException.class, () -> service.aceitar(token));
        verify(membros, times(1)).save(any());
    }

    @Test void outroEmailNaoPodeAceitar() {
        pendente(); assertThrows(AccessDeniedException.class, () -> service.aceitar(token));
        verify(membros, never()).save(any());
    }

    @Test void contaNaoConfirmadaNaoPodeAceitar() {
        pendente(); convidado.setEmailConfirmado(false); when(autenticacao.getUsuarioAutenticado()).thenReturn(convidado);
        assertThrows(AccessDeniedException.class, () -> service.aceitar(token)); verify(membros, never()).save(any());
    }

    @Test void linkExpiradoOuCanceladoNaoCriaVinculo() {
        var convite = pendente(); when(autenticacao.getUsuarioAutenticado()).thenReturn(convidado);
        convite.setExpiraEm(LocalDateTime.now().minusSeconds(1));
        assertThrows(BusinessException.class, () -> service.aceitar(token));
        convite.setExpiraEm(LocalDateTime.now().plusDays(1)); convite.setCancelado(true);
        assertThrows(BusinessException.class, () -> service.aceitar(token)); verify(membros, never()).save(any());
    }

    @Test void reenvioInvalidaTokenAnteriorERespeitaIntervalo() {
        var convite = pendente();
        when(convites.findByCarteiraAndEmail(carteira, convidado.getEmail())).thenReturn(Optional.of(convite));
        String previous = convite.getTokenHash();
        service.convidar(3L, new WalletMemberRequest(convidado.getEmail(), TipoPermissao.VISUALIZADOR));
        assertNotEquals(previous, convite.getTokenHash());
        assertThrows(BusinessException.class, () -> service.convidar(3L, new WalletMemberRequest(convidado.getEmail(), TipoPermissao.EDITOR)));
        verify(events, times(1)).publishEvent(any(ConviteCarteiraService.ConvitePendente.class));
    }

    @Test void cancelamentoVerificaCarteira() {
        var convite = pendente(); when(convites.findById(4L)).thenReturn(Optional.of(convite));
        service.cancelar(3L, 4L); assertTrue(convite.isCancelado());
        var outra = new Carteira(); outra.setId(99L); convite.setCarteira(outra);
        assertThrows(ResourceNotFoundException.class, () -> service.cancelar(3L, 4L));
    }
}
