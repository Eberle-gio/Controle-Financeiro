package controle_financeiro.backend.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Component
public class JwtUtils {

    @Value("${jwt.secret}")
    private String jwtSecret;

    @Value("${jwt.access-expiration:600000}")
    private long accessExpirationMs;

    @Value("${jwt.refresh-expiration:604800000}")
    private long refreshExpirationMs;

    private SecretKey key;

    public long getExpirationSeconds() {
        return accessExpirationMs / 1000;
    }

    @PostConstruct
    public void init() {
        this.key = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
    }

    public String gerarAccessToken(Long userId, String email, String name, Long versaoSessao) {
        return gerarToken(userId, email, name, versaoSessao, "access", accessExpirationMs);
    }

    // Mantem a API anterior para os pontos de integracao e testes existentes.
    public String gerarToken(Long userId, String email, String name) {
        return gerarAccessToken(userId, email, name, 0L);
    }

    public String gerarToken(Long userId, String email, String name, Long versaoSessao) {
        return gerarAccessToken(userId, email, name, versaoSessao);
    }

    public String gerarRefreshToken(Long userId, String email, String name, Long versaoSessao) {
        return gerarToken(userId, email, name, versaoSessao, "refresh", refreshExpirationMs);
    }

    private String gerarToken(Long userId, String email, String name, Long versaoSessao,
                              String tokenType, long expirationMs) {
        Date agora = new Date();
        return Jwts.builder()
                .subject(String.valueOf(userId))
                .claim("email", email)
                .claim("name", name)
                .claim("tokenType", tokenType)
                .claim("sessionVersion", versaoSessao == null ? 0L : versaoSessao)
                .issuedAt(agora)
                .expiration(new Date(agora.getTime() + expirationMs))
                .signWith(key)
                .compact();
    }

    public String obterEmailDoToken(String token) {
        Claims claims = extrairClaims(token);
        String email = claims.get("email", String.class);
        if (email == null || email.isBlank()) {
            email = claims.getSubject();
        }
        return email;
    }

    public boolean validarAccessToken(String token) {
        return validarTokenDoTipo(token, "access");
    }

    public boolean validarToken(String token) {
        return validarAccessToken(token);
    }

    public boolean validarRefreshToken(String token) {
        return validarTokenDoTipo(token, "refresh");
    }

    private boolean validarTokenDoTipo(String token, String tipoEsperado) {
        try {
            return tipoEsperado.equals(extrairClaims(token).get("tokenType", String.class));
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    public Long obterIdUsuarioDoToken(String token) {
        return Long.valueOf(extrairClaims(token).getSubject());
    }

    public long obterVersaoSessao(String token) {
        Number versao = extrairClaims(token).get("sessionVersion", Number.class);
        return versao == null ? 0L : versao.longValue();
    }

    private Claims extrairClaims(String token) {
        return Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload();
    }
}
