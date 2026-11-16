package controle_financeiro.backend.controller;

import org.springframework.http.MediaType;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import controle_financeiro.backend.service.CarteiraRealtimeService;
import controle_financeiro.backend.service.CarteiraService;
import controle_financeiro.backend.service.UsuarioService;

@RestController
@RequestMapping("/api/v1/wallets/{walletId}/events")
public class CarteiraRealtimeController {
    private final CarteiraRealtimeService realtimeService;
    private final CarteiraService carteiraService;
    private final UsuarioService usuarioService;

    public CarteiraRealtimeController(CarteiraRealtimeService realtimeService,
            CarteiraService carteiraService, UsuarioService usuarioService) {
        this.realtimeService = realtimeService;
        this.carteiraService = carteiraService;
        this.usuarioService = usuarioService;
    }

    @GetMapping(produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public ResponseEntity<SseEmitter> assinar(@PathVariable Long walletId) {
        var usuario = usuarioService.getUsuarioAutenticado();
        carteiraService.buscarVinculoOuFalhar(walletId, usuario);
        HttpHeaders headers = new HttpHeaders();
        headers.setCacheControl("no-cache, no-transform");
        headers.set("X-Accel-Buffering", "no");
        return ResponseEntity.ok()
                .headers(headers)
                .contentType(MediaType.TEXT_EVENT_STREAM)
                .body(realtimeService.assinar(walletId));
    }
}
