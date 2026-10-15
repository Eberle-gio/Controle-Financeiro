package controle_financeiro.backend.service;

import controle_financeiro.backend.controller.*;
import controle_financeiro.backend.dto.*;
import controle_financeiro.backend.exception.GlobalExceptionHandler;
import controle_financeiro.backend.model.TipoPermissao;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class ApiContractTest {
    @Test
    void recuperacaoNaoExpoeTokenNoJson() throws Exception {
        var service = mock(UsuarioService.class);
        when(service.solicitarRecuperacaoSenha(anyString())).thenReturn("segredo-que-nao-pode-sair-na-api");
        var controller = new AuthController();
        ReflectionTestUtils.setField(controller, "usuarioService", service);
        var mvc = MockMvcBuilders.standaloneSetup(controller).setControllerAdvice(new GlobalExceptionHandler()).build();
        mvc.perform(post("/api/auth/forgot-password").contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"cliente@example.com\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.message").exists())
                .andExpect(jsonPath("$.debugToken").doesNotExist());
    }

    @Test
    void membrosAceitamCamposEPermissoesDoFormulario() throws Exception {
        var service = mock(CarteiraService.class);
        when(service.adicionarMembro(eq(2L), any())).thenReturn(WalletMemberResponse.builder()
                .id(7L).usuarioId(9L).usuarioNome("João").usuarioEmail("cliente@example.com")
                .papel(TipoPermissao.VISUALIZADOR).build());
        var controller = new CarteiraController();
        ReflectionTestUtils.setField(controller, "carteiraService", service);
        var mvc = MockMvcBuilders.standaloneSetup(controller).setControllerAdvice(new GlobalExceptionHandler()).build();
        mvc.perform(post("/api/v1/wallets/2/members").contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"cliente@example.com\",\"papel\":\"VISUALIZADOR\"}"))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.usuarioId").value(9))
                .andExpect(jsonPath("$.usuarioNome").value("João"))
                .andExpect(jsonPath("$.userId").doesNotExist());
        mvc.perform(post("/api/v1/wallets/2/members").contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"cliente@example.com\",\"papel\":\"LEITURA\"}"))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.message").isNotEmpty());
    }

    @Test
    void ordenacaoPadraoUsaCampoRealDaEntidade() throws Exception {
        var service = mock(TransacaoService.class);
        var controller = new TransacaoController();
        ReflectionTestUtils.setField(controller, "transacaoService", service);
        var mvc = MockMvcBuilders.standaloneSetup(controller).build();
        mvc.perform(get("/api/v1/wallets/2/transactions")).andExpect(status().isOk());
        verify(service).listarPaginado(2L, 0, 20, "data,desc", null, null, null, null);
    }

    @Test
    void nomeComDoisCaracteresFalhaNoDtoSemChegarAoBanco() throws Exception {
        var service = mock(UsuarioService.class);
        var controller = new AuthController();
        ReflectionTestUtils.setField(controller, "usuarioService", service);
        var mvc = MockMvcBuilders.standaloneSetup(controller).setControllerAdvice(new GlobalExceptionHandler()).build();
        mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"Jo\",\"email\":\"cliente@example.com\",\"password\":\"123456\"}"))
                .andExpect(status().isBadRequest());
        verifyNoInteractions(service);
    }
}
