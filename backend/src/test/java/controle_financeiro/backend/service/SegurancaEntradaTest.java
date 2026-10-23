package controle_financeiro.backend.service;

import controle_financeiro.backend.dto.TransactionRequest;
import controle_financeiro.backend.security.SensitiveRouteLimitFilter;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.*;
import jakarta.servlet.FilterChain;
import jakarta.validation.Validation;
import java.math.BigDecimal;
import java.time.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class SegurancaEntradaTest {
    @Test void corsAceitaSomenteOrigensConfiguradas() {
        var config = new controle_financeiro.backend.config.SecurityConfig();
        org.springframework.test.util.ReflectionTestUtils.setField(config, "allowedOrigins", "https://app.example, http://localhost:5173");
        var cors = config.corsConfigurationSource().getCorsConfiguration(new MockHttpServletRequest("GET", "/api/v1/wallets"));
        assertEquals("https://app.example", cors.checkOrigin("https://app.example"));
        assertNull(cors.checkOrigin("https://outro.example"));
    }

    @Test void limiteExpiraENaoInterfereEmConsultas() throws Exception {
        Clock clock = mock(Clock.class); when(clock.millis()).thenReturn(1_000_000L);
        var filter = new SensitiveRouteLimitFilter(clock); var chain = mock(FilterChain.class);
        for (int i = 0; i < 6; i++) {
            var request = new MockHttpServletRequest("POST", "/api/auth/forgot-password"); request.setServletPath("/api/auth/forgot-password");
            var response = new MockHttpServletResponse(); filter.doFilter(request, response, chain);
            if (i == 5) assertEquals(429, response.getStatus());
        }
        var read = new MockHttpServletRequest("GET", "/api/v1/wallets"); read.setServletPath("/api/v1/wallets");
        var response = new MockHttpServletResponse(); filter.doFilter(read, response, chain); assertEquals(200, response.getStatus());
        when(clock.millis()).thenReturn(2_000_000L);
        var retry = new MockHttpServletRequest("POST", "/api/auth/forgot-password"); retry.setServletPath("/api/auth/forgot-password");
        response = new MockHttpServletResponse(); filter.doFilter(retry, response, chain); assertEquals(200, response.getStatus());
    }

    @Test void bloqueiaExcessoDeLoginPorIpSemConfiarEmForwardedFor() throws Exception {
        var filter = new SensitiveRouteLimitFilter();
        var chain = mock(FilterChain.class);
        for (int i = 0; i < 11; i++) {
            var request = new MockHttpServletRequest("POST", "/api/auth/login");
            request.setServletPath("/api/auth/login"); request.setRemoteAddr("192.0.2.1");
            request.addHeader("X-Forwarded-For", "192.0.2." + (i + 2));
            var response = new MockHttpServletResponse(); filter.doFilter(request, response, chain);
            if (i == 10) { assertEquals(429, response.getStatus()); assertNotNull(response.getHeader("Retry-After")); }
            else assertEquals(200, response.getStatus());
        }
        verify(chain, times(10)).doFilter(any(), any());
        var other = new MockHttpServletRequest("POST", "/api/auth/login");
        other.setServletPath("/api/auth/login"); other.setRemoteAddr("192.0.2.2");
        var response = new MockHttpServletResponse(); filter.doFilter(other, response, chain);
        assertEquals(200, response.getStatus());
    }

    @Test void validaPrecisaoMonetariaAntesDePersistir() {
        try (var factory = Validation.buildDefaultValidatorFactory()) {
            var validator = factory.getValidator(); var request = new TransactionRequest();
            for (String value : new String[]{"0.001", "1.999", "10000000000000.00"}) {
                request.setValor(new BigDecimal(value));
                assertFalse(validator.validateProperty(request, "valor").isEmpty(), value);
            }
            request.setValor(new BigDecimal("9999999999999.99"));
            assertTrue(validator.validateProperty(request, "valor").isEmpty());
        }
    }
}
