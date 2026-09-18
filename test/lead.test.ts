import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  mascaraWhatsapp,
  whatsappInternacional,
  extrairDigitosNacionais,
  validarLead,
  normalizarLead,
  ehMenorDeIdade,
  faixasIdade,
  leadVazio,
  type Lead,
} from "@/lib/lead";

const leadValido: Lead = {
  nome: "Fulana de Tal",
  whatsapp: "(11) 91234-5678",
  email: "fulana@exemplo.com",
  idade: "18 a 21",
  peso: "Outro",
  contexto: "",
  consentimento: true,
  confirmacaoResponsavel: false,
};

describe("telefone — os casos que a auditoria reproduziu", () => {
  test("número nacional é preservado e vira link 55+DDD+número", () => {
    assert.equal(mascaraWhatsapp("(11) 91234-5678"), "(11) 91234-5678");
    assert.equal(whatsappInternacional("(11) 91234-5678"), "5511912345678");
  });

  test("+55 colado NÃO é lido como DDD 55 (o bug original)", () => {
    // Antes: máscara "(55) 11912-3456" e link "5555119123456".
    assert.equal(mascaraWhatsapp("+55 (11) 91234-5678"), "(11) 91234-5678");
    assert.equal(whatsappInternacional("+55 (11) 91234-5678"), "5511912345678");
  });

  test("nacional e com +55 resolvem pro MESMO número e MESMO destino", () => {
    assert.equal(
      extrairDigitosNacionais("+55 (11) 91234-5678"),
      extrairDigitosNacionais("(11) 91234-5678"),
    );
    assert.equal(
      whatsappInternacional("5511912345678"),
      whatsappInternacional("11912345678"),
    );
  });

  test("DDD 55 de verdade (Caxias do Sul) não é confundido com DDI", () => {
    // 10 dígitos: nunca chega a 12, então não há "55" de país pra cortar.
    assert.equal(extrairDigitosNacionais("5511123456"), "5511123456");
    assert.equal(mascaraWhatsapp("5511123456"), "(55) 1112-3456");
    assert.deepEqual(
      validarLead({ ...leadValido, whatsapp: "5511123456" }).whatsapp,
      undefined,
    );
    // 11 dígitos (celular em DDD 55):
    assert.equal(extrairDigitosNacionais("55991234567"), "55991234567");
    assert.equal(
      validarLead({ ...leadValido, whatsapp: "55991234567" }).whatsapp,
      undefined,
    );
  });

  test("DDI com 12 dígitos (fixo) também é reconhecido", () => {
    assert.equal(extrairDigitosNacionais("551132345678"), "1132345678");
  });
});

describe("telefone — o que precisa ser rejeitado", () => {
  const invalidos: Array<[string, string]> = [
    ["só zeros", "00000000000"],
    ["DDD 00", "00912345678"],
    ["DDD abaixo de 11 (o 10 não existe)", "10912345678"],
    ["celular sem o 9 na frente", "11812345678"],
    ["um dígito repetido (fixo)", "9999999999"],
    ["um dígito repetido (celular)", "99999999999"],
    ["curto demais", "119123456"],
    ["longo demais (14 dígitos)", "55119123456789"],
    ["12 dígitos que não começam com 55", "111234567890"],
    ["vazio", ""],
    ["só letras", "abcdefghijk"],
  ];

  for (const [descricao, entrada] of invalidos) {
    test(descricao, () => {
      const erros = validarLead({ ...leadValido, whatsapp: entrada });
      assert.ok(erros.whatsapp, `deveria rejeitar ${JSON.stringify(entrada)}`);
    });
  }

  test("fixo de 10 dígitos válido passa", () => {
    assert.equal(
      validarLead({ ...leadValido, whatsapp: "(11) 3234-5678" }).whatsapp,
      undefined,
    );
  });
});

describe("máscara enquanto a pessoa digita", () => {
  test("etapas parciais", () => {
    assert.equal(mascaraWhatsapp(""), "");
    assert.equal(mascaraWhatsapp("1"), "1");
    assert.equal(mascaraWhatsapp("11"), "11");
    assert.equal(mascaraWhatsapp("119"), "(11) 9");
    assert.equal(mascaraWhatsapp("1191234"), "(11) 9123-4");
    assert.equal(mascaraWhatsapp("11912345678"), "(11) 91234-5678");
  });

  test("é idempotente: reprocessar a saída dá a mesma saída (a UI faz isso a cada tecla)", () => {
    for (const entrada of ["11912345678", "+55 11 91234-5678", "1132345678", "119"]) {
      const uma = mascaraWhatsapp(entrada);
      assert.equal(mascaraWhatsapp(uma), uma, `instável para ${entrada}`);
    }
  });

  test("nunca passa de 11 dígitos, mesmo com lixo enorme colado", () => {
    const saida = mascaraWhatsapp("9".repeat(200));
    assert.equal(saida.replace(/\D/g, "").length, 11);
  });
});

describe("validarLead", () => {
  test("lead válido não tem erro nenhum", () => {
    assert.deepEqual(validarLead(leadValido), {});
  });

  test("lead vazio reprova todos os obrigatórios, e só eles", () => {
    const erros = validarLead(leadVazio);
    assert.deepEqual(
      Object.keys(erros).sort(),
      ["consentimento", "email", "idade", "nome", "peso", "whatsapp"],
    );
  });

  test("e-mail com espaços nas pontas é aceito (não era bug, a auditoria corrigiu)", () => {
    assert.deepEqual(
      validarLead({ ...leadValido, email: "  fulana@exemplo.com  " }),
      {},
    );
  });

  test("e-mail malformado ou gigante é rejeitado", () => {
    for (const email of ["sem-arroba", "a@b", "a b@c.com", "a@b.c", `${"x".repeat(200)}@b.com`]) {
      assert.ok(validarLead({ ...leadValido, email }).email, email);
    }
  });

  test("nome: mínimo 2, máximo 120", () => {
    assert.ok(validarLead({ ...leadValido, nome: "A" }).nome);
    assert.ok(validarLead({ ...leadValido, nome: " " }).nome);
    assert.ok(validarLead({ ...leadValido, nome: "x".repeat(121) }).nome);
    assert.equal(validarLead({ ...leadValido, nome: "x".repeat(120) }).nome, undefined);
  });

  test("contexto: até 400 caracteres", () => {
    assert.equal(validarLead({ ...leadValido, contexto: "x".repeat(400) }).contexto, undefined);
    assert.ok(validarLead({ ...leadValido, contexto: "x".repeat(401) }).contexto);
  });

  test("valores fora da lista permitida são rejeitados (não dá pra injetar via curl)", () => {
    assert.ok(validarLead({ ...leadValido, idade: "99" }).idade);
    assert.ok(validarLead({ ...leadValido, peso: "hackeado" }).peso);
  });

  test("consentimento é obrigatório", () => {
    assert.ok(validarLead({ ...leadValido, consentimento: false }).consentimento);
  });
});

describe("menores de idade (16-17)", () => {
  test("a faixa 16-17 existe isolada, e só ela é de menor", () => {
    assert.ok(faixasIdade.includes("16 a 17"));
    assert.equal(ehMenorDeIdade("16 a 17"), true);
    for (const f of ["18 a 21", "22 a 25", "26 ou mais", "", "qualquer"]) {
      assert.equal(ehMenorDeIdade(f), false, f);
    }
  });

  test("a faixa antiga 16-18 (menor e maior misturados) não é mais aceita", () => {
    assert.ok(validarLead({ ...leadValido, idade: "16 a 18" }).idade);
  });

  test("16-17 sem confirmação do responsável é barrado", () => {
    const erros = validarLead({ ...leadValido, idade: "16 a 17", confirmacaoResponsavel: false });
    assert.ok(erros.confirmacaoResponsavel);
  });

  test("16-17 com confirmação passa", () => {
    assert.deepEqual(
      validarLead({ ...leadValido, idade: "16 a 17", confirmacaoResponsavel: true }),
      {},
    );
  });

  test("18+ não exige confirmação de responsável", () => {
    assert.equal(
      validarLead({ ...leadValido, idade: "18 a 21", confirmacaoResponsavel: false })
        .confirmacaoResponsavel,
      undefined,
    );
  });
});

describe("normalizarLead — o que chega da rede nunca é confiável", () => {
  test("telefone vai pro banco em formato canônico, não mascarado", () => {
    assert.equal(normalizarLead({ ...leadValido, whatsapp: "+55 (11) 91234-5678" }).whatsapp, "11912345678");
    assert.equal(normalizarLead({ ...leadValido, whatsapp: "(11) 91234-5678" }).whatsapp, "11912345678");
  });

  test("e-mail: trim e minúsculas; nome: trim", () => {
    const l = normalizarLead({ ...leadValido, email: "  Fulana@EXEMPLO.com ", nome: "  Fulana  " });
    assert.equal(l.email, "fulana@exemplo.com");
    assert.equal(l.nome, "Fulana");
  });

  test("consentimento só vale como booleano true — string, número e objeto não coagem", () => {
    for (const valor of ["true", 1, "1", {}, [], null, undefined, "sim"]) {
      const l = normalizarLead({ ...leadValido, consentimento: valor, confirmacaoResponsavel: valor });
      assert.equal(l.consentimento, false, `consentimento: ${JSON.stringify(valor)}`);
      assert.equal(l.confirmacaoResponsavel, false, `confirmacaoResponsavel: ${JSON.stringify(valor)}`);
    }
    assert.equal(normalizarLead({ ...leadValido, consentimento: true }).consentimento, true);
  });

  test("corpo que não é objeto vira lead vazio, sem exceção", () => {
    for (const corpo of [null, undefined, "texto", 42, [], true]) {
      assert.deepEqual(normalizarLead(corpo), { ...leadVazio, whatsapp: "" });
    }
  });

  test("campos de tipo errado viram vazio (e aí reprovam na validação)", () => {
    const l = normalizarLead({ nome: 123, email: ["a@b.com"], idade: {}, peso: null, contexto: false });
    assert.equal(l.nome, "");
    assert.equal(l.email, "");
    assert.equal(l.idade, "");
    assert.ok(Object.keys(validarLead(l)).length >= 5);
  });
});
