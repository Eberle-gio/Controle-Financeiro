package controle_financeiro.backend.service;

import controle_financeiro.backend.model.Usuario;
import controle_financeiro.backend.repository.UsuarioRepository;
import controle_financeiro.backend.repository.CarteiraRepository;
import controle_financeiro.backend.repository.MembroCarteiraRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import java.util.UUID;
import java.util.concurrent.*;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.MOCK,
        properties = {"debug=false", "logging.level.root=ERROR", "spring.jpa.show-sql=false"})
@EnabledIfEnvironmentVariable(named = "RUN_MYSQL_INTEGRATION_TESTS", matches = "true")
class CarteiraPadraoMySqlTest {
    @Autowired private CarteiraService service;
    @Autowired private UsuarioRepository usuarios;
    @Autowired private CarteiraRepository carteiras;
    @Autowired private MembroCarteiraRepository membros;
    @Autowired private PlatformTransactionManager transactionManager;

    @Test
    void duasRequisicoesSimultaneasCriamUmaUnicaCarteira() throws Exception {
        var tx = new TransactionTemplate(transactionManager);
        Usuario usuario = tx.execute(status -> {
            Usuario novo = new Usuario();
            novo.setNome("Teste concorrencia");
            novo.setEmail("carteira-" + UUID.randomUUID() + "@example.com");
            novo.setSenha("hash-exclusivo-de-teste");
            novo.setEmailConfirmado(true);
            return usuarios.saveAndFlush(novo);
        });
        var executor = Executors.newFixedThreadPool(2);
        var ready = new CountDownLatch(2);
        var start = new CountDownLatch(1);
        Callable<Long> request = () -> {
            try {
                SecurityContextHolder.getContext().setAuthentication(
                        new UsernamePasswordAuthenticationToken(usuario.getEmail(), null, java.util.List.of()));
                ready.countDown();
                if (!start.await(10, TimeUnit.SECONDS)) throw new IllegalStateException("Timeout");
                return service.garantirCarteiraPadrao().getId();
            } finally {
                SecurityContextHolder.clearContext();
            }
        };
        try {
            var first = executor.submit(request);
            var second = executor.submit(request);
            assertTrue(ready.await(10, TimeUnit.SECONDS));
            start.countDown();
            assertEquals(first.get(20, TimeUnit.SECONDS), second.get(20, TimeUnit.SECONDS));
            tx.executeWithoutResult(status -> {
                assertEquals(1, carteiras.findByDono(usuario).size());
                assertEquals(1, membros.findByUsuario(usuario).size());
            });
        } finally {
            start.countDown();
            executor.shutdown();
            executor.awaitTermination(30, TimeUnit.SECONDS);
            tx.executeWithoutResult(status -> {
                // Limpa somente os dados vinculados ao usuario ficticio deste teste.
                for (var carteira : carteiras.findByDono(usuario)) {
                    membros.deleteByCarteira(carteira);
                    carteiras.delete(carteira);
                }
                usuarios.deleteById(usuario.getId());
            });
        }
    }
}
