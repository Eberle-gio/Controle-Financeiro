package controle_financeiro.backend.controller;

import controle_financeiro.backend.dto.ResumoCarteiraDTO;
import controle_financeiro.backend.model.Transacao;
import controle_financeiro.backend.service.TransacaoService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;

@RestController
@RequestMapping("/api/transacoes")
@CrossOrigin(origins = "*")
public class TransacaoController {

    @Autowired
    private TransacaoService transacaoService;

    // POST /api/transacoes?carteiraId={id}&usuarioId={id}
    @PostMapping
    public ResponseEntity<?> criar(@Valid @RequestBody Transacao transacao,
                                    @RequestParam Long carteiraId,
                                    @RequestParam Long usuarioId) {
        try {
            Transacao salva = transacaoService.criar(transacao, carteiraId, usuarioId);
            return ResponseEntity.status(HttpStatus.CREATED).body(salva);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    // GET /api/transacoes/resumo?carteiraId={id}&usuarioId={id}&inicio={date}&fim={date}
    // Retorna o resumo completo da carteira para exibição no Dashboard
    @GetMapping("/resumo")
    public ResponseEntity<?> resumo(@RequestParam Long carteiraId,
                                     @RequestParam Long usuarioId,
                                     @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate inicio,
                                     @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fim) {
        try {
            ResumoCarteiraDTO resumo = transacaoService.gerarResumo(carteiraId, usuarioId, inicio, fim);
            return ResponseEntity.ok(resumo);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        }
    }
}
