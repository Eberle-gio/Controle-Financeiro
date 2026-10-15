package controle_financeiro.backend.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;
import controle_financeiro.backend.model.Usuario;
import controle_financeiro.backend.repository.UsuarioRepository;
import java.time.LocalDateTime;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.MOCK,
        properties = {"debug=false", "logging.level.root=WARN", "spring.jpa.show-sql=false"})
@EnabledIfEnvironmentVariable(named = "RUN_MYSQL_INTEGRATION_TESTS", matches = "true")
class ConfirmacaoMySqlTest {
    @Autowired
    private ConfirmacaoCadastroService service;

    @Autowired
    private UsuarioRepository usuarios;

    @Test
    void consultaTokenInexistenteNoMySqlSemAlterarCadastros() {
        assertThrows(IllegalArgumentException.class, () -> service.confirmar("a".repeat(64)));
    }

    @Test
    @Transactional
    void confirmaCadastroComBloqueioRealEImpedeReusoDoLink() {
        String token = UUID.randomUUID().toString().replace("-", "").repeat(2);
        Usuario usuario = new Usuario();
        usuario.setNome("Teste de confirmacao");
        usuario.setEmail("confirmacao-" + UUID.randomUUID() + "@example.com");
        usuario.setSenha("hash-exclusivo-de-teste");
        usuario.setEmailConfirmado(false);
        usuario.setConfirmacaoTokenHash(ConfirmacaoCadastroService.hash(token));
        usuario.setConfirmacaoExpiraEm(LocalDateTime.now().plusHours(1));
        usuarios.saveAndFlush(usuario);
        assertTrue(usuarios.buscarParaConfirmacaoPorEmail(usuario.getEmail()).isPresent());
        service.confirmar(token);
        usuarios.flush();
        assertEquals(true, usuario.getEmailConfirmado());
        assertNull(usuario.getConfirmacaoTokenHash());
        assertThrows(IllegalArgumentException.class, () -> service.confirmar(token));
        // A transacao do teste e revertida, sem manter o usuario de teste.
    }
}
