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

Na Etapa 2, o controlador automático interrompe com diagnóstico quando o robô não encontra ação legal. O simulador classifica o caso como `INTERRUPTED`. Isso preserva a lacuna de regra em vez de introduzir um passe silencioso.

## Estratégia dos robôs

A dificuldade básica usa pesos simples e informação imperfeita. Ainda precisam ser decididos:

- níveis de dificuldade e parâmetros expostos na configuração;
- profundidade de planejamento aceitável e orçamento de CPU;
- política de desempate entre ações igualmente avaliadas;
- telemetria de playtests para recalibrar pesos sem alterar o catálogo silenciosamente.

O bot atual não deve ser descrito como adversário avançado. As 100 simulações iniciais comprovam execução e invariantes dentro desse lote, não ausência universal de travamentos.

## Causa do reinício e persistência

Foi comprovado que `useLocalGame` mantinha o `GameState` exclusivamente em `useState`; F5, navegação e remontagem destruíam o snapshot. A hipótese de reinícios adicionais por Fast Refresh/Strict Mode não foi reproduzida, mas deixou de poder substituir o estado oficial porque a montagem agora apenas consulta o MySQL.

MySQL é a fonte autoritativa e `localStorage` não é usado. Em 24/10/2026, o serviço `MySQL2610` e a porta local 3306 estavam acessíveis, mas não havia `DATABASE_URL` nem cliente `mysql` no PATH. Portanto, versão, schema selecionado, consulta real, migração e recuperação ponta a ponta ainda dependem das credenciais da aplicação; possuir apenas o Workbench não satisfaz esse requisito.

## Privacidade e idempotência

O núcleo diferencia reservas públicas da mesa e reservas ocultas do topo. A camada persistente adiciona `gameSessionId`, `expectedRevision` e unicidade de `actionId`. A sessão anônima HttpOnly é adequada ao jogo local, mas não substitui contas, revogação avançada, rate limiting e autenticação para multiplayer.

## Propriedade intelectual

Não há imagens oficiais no projeto. Os placeholders são tipográficos. Uma publicação comercial precisa de identidade e personagens próprios ou licença apropriada.

## Auditoria de dependências

Em 23/10/2026, após a atualização do lockfile ao adicionar o executor de desenvolvimento `tsx`, `npm audit --omit=dev` e `npm audit` não encontraram vulnerabilidades. `tsx` existe somente para executar o simulador TypeScript sem duplicar o motor em JavaScript.

O npm emitiu um aviso de engine para `eslint-visitor-keys@5.0.1`: a versão instalada do Node era 22.12.0, enquanto essa dependência de desenvolvimento requer Node 22.13.0 ou superior dentro da linha 22. O lint concluiu corretamente, mas recomenda-se Node LTS 22.13+ para eliminar a diferença de ambiente.

## Prontidão operacional

O motor está preparado arquiteturalmente para receber uma interface jogável, mas não deve ser descrito como pronto para produção ou multiplayer. Ainda faltam persistência autoritativa, controle de concorrência/versão, autenticação, limites de requisição e testes de transporte.
