# Decisões e inconsistências pendentes

Este arquivo registra lacunas sem alterar silenciosamente documentos ou dados.

## Dados ausentes no repositório

O README original referenciava `01-visao-e-componentes.md`, `06-locais-e-especiais.md`, `09-testes-e-casos-limite.md`, `10-pendencias-e-fontes.md` e `data/cartas.catalogo.json`, mas esses caminhos não existem. O catálogo real está em `cartas.catalogo.json`. Ele foi preservado na raiz e é importado diretamente, evitando duplicação.

## Catálogo experimental versus referência oficial

`02-regras-oficiais.md` registra como exemplo oficial que Rocket custa 1 amarelo e 2 vermelhos. O catálogo experimental define Rocket com 1 roxo e 1 vermelho. Conforme a orientação da Etapa 1, o motor usa o JSON para gameplay. Nenhum dos dois arquivos foi corrigido automaticamente.

`05-cartas-e-personagens.md` e `08-modelagem-e-contratos.md` ainda descrevem atributos como desconhecidos/nulos e apontam para `data/cartas.catalogo.json`. Já `11-catalogo-balanceado.md` e o JSON real trazem atributos autorais completos. O validador aceita e exige os valores completos do catálogo real, sempre identificados como não oficiais.

## Locais

Não há catálogo com as oito faces, nomes e requisitos dos quatro cartões de Local. O motor possui contratos tipados e aceita fixtures injetadas, mas a inicialização padrão usa lista vazia. Portanto, a regra de elegibilidade é implementada e testável, mas o conteúdo real de Locais não está disponível para uma partida de produção.

Pendências antes de habilitar Locais na interface:

- transcrever as oito faces de fonte verificável;
- definir qual face de cada cartão entra na partida e como ela é sorteada;
- confirmar a UX quando várias faces ficam elegíveis no mesmo turno.

## Rodada final e casos sem ação

O encerramento ocorre no fim da rodada corrente, depois que todos tiveram a mesma quantidade de turnos. Se nenhum jogador continuar elegível nesse ponto, a rodada final é revogada, conforme a documentação existente.

Ainda falta uma decisão de produto para um estado extremo em que nenhum jogador tenha ação principal legal. O motor não inventa passe de turno nem encerramento técnico.

## Privacidade e idempotência futura

O núcleo já mascara reservas e bloqueia `actionId` repetido. `matchId`, `turnId`, autenticação e `expectedRevision` pertencem à futura camada de comando/servidor; não foram adicionados como falsa infraestrutura local.

## Propriedade intelectual

Não há imagens oficiais no projeto. Os placeholders são tipográficos. Uma publicação comercial precisa de identidade e personagens próprios ou licença apropriada.

## Auditoria de dependências

`npm audit --omit=dev` não encontrou vulnerabilidades nas dependências de produção. A auditoria completa aponta cinco ocorrências altas em `braces`, alcançado pela cadeia de lint do `eslint-config-next` 16.4.2. A correção automática proposta exige forçar downgrade incompatível para Next 14; por isso não foi aplicada. Reavaliar quando a configuração oficial do Next atualizar essa cadeia.
