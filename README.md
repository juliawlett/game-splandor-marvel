# Nexus Infinito — jogo de estratégia por turnos

Fundação local de um jogo digital inspirado em **Splendor: Marvel**. O projeto não é oficial nem licenciado. Os custos, bônus, pontos e símbolos presentes no catálogo são um balanceamento autoral e experimental.

As Etapas 1 e 2 entregam o motor de regras e uma partida local completa contra robôs. O multiplayer online ainda não foi iniciado.

## Requisitos e execução local

- Node.js 20.9 ou superior (recomendado: LTS 22.13+)
- npm 10 ou superior

```bash
npm install
npm run dev
```

Acesse `http://localhost:3000`. Use `/jogar` para configurar uma partida contra 1 a 3 robôs e `/catalogo` para consultar as 90 cartas. Tudo funciona localmente, sem API externa.

Verificações disponíveis:

```bash
npm test
npm run lint
npm run typecheck
npm run simulate
npm run build
```

## Estrutura implementada

- `src/app/`: App Router, layout, página inicial e catálogo.
- `src/features/game/`: apresentação específica do catálogo.
- `src/features/game/local/`: controlador local e componentes do tabuleiro.
- `src/game/core/`: motor TypeScript puro, ações, regras, seletores e contratos.
- `src/game/bots/`: decisão determinística do robô básico a partir de `GameView`.
- `src/game/simulation/`: partidas automáticas e validação de invariantes.
- `src/game/data/`: importação e validação estrita do catálogo.
- `src/game/tests/`: testes unitários e fixtures determinísticas.
- `docs/`: arquitetura, decisões pendentes e progresso.
- `cartas.catalogo.json`: fonte única dos 90 personagens usados no protótipo.

## Entregue

- Catálogo validado em 40/30/20 cartas e inicialização determinística para 2–4 participantes.
- Motor imutável no formato `GameState + GameAction -> novo GameState + eventos`.
- Validação estrutural de ações recebidas em runtime, antes de acessar ou alterar o estado.
- Recursos, reservas, recrutamento, descontos, curingas, limite de fichas e turnos.
- Joia do Tempo, Vingadores, contratos de Local, Manopla, rodada final e desempates.
- Projeção defensiva que mantém reservas da mesa públicas, oculta reservas do topo e nunca expõe a ordem dos baralhos.
- Home responsiva e catálogo pesquisável/filtrável, sem arte protegida.
- Configuração local para uma pessoa contra 1, 2 ou 3 robôs.
- Tabuleiro responsivo com mercado, banco, coleta, reserva, recrutamento, pagamento ajustável, descarte obrigatório, histórico e resultado final.
- Robô básico que enumera ações legais pela visão autorizada, pontua alternativas e resolve etapas obrigatórias.
- Simulador reproduzível com checagem de conservação de recursos, unicidade das cartas e ordem de turnos.
- 78 testes automatizados com Vitest, incluindo integridade, privacidade, bots, controlador local e simulações.

## Como jogar contra robôs

1. Execute `npm run dev` e abra `http://localhost:3000/jogar`.
2. Informe seu nome, escolha de 1 a 3 robôs e, opcionalmente, uma seed.
3. No seu turno, colete joias, abra uma carta para recrutar ou reservar, ou reserve o topo de um nível.
4. Quando houver excesso de fichas, conclua a devolução obrigatória. Os robôs jogam automaticamente.
5. A classificação vem do motor quando a rodada final termina.

O simulador usa os mesmos `initializeGame`, `getPlayerView` e `applyGameAction` da interface:

```bash
npm run simulate
npm run simulate -- --games=200 --turns=700
```

O limite não produz vitória artificial. Uma partida que não termina é reportada como inconclusiva.

## Ainda não implementado

- Multiplayer, WebSocket ou backend.
- Dificuldades avançadas e busca estratégica para os robôs.
- Contas, autenticação, banco de dados, ranking, chat e deploy.
- Dados definitivos das faces de Local e artes oficiais.

Consulte [a arquitetura](docs/arquitetura.md), [as decisões pendentes](docs/decisoes-pendentes.md) e [o progresso](docs/progresso.md). A próxima etapa recomendada é consolidar o catálogo de Locais e planejar uma camada autoritativa de transporte para multiplayer, sem mover regras para a interface.

---

## Documentação de pesquisa original

> Versão 0.1 — 22/10/2026. Idioma: pt-BR. Objetivo: especificar regras, fluxos e dados **antes de desenvolver**. Este material descreve o jogo de mesa como referência e propõe uma adaptação digital; não é um produto oficial ou licenciado.

## Objetivo do projeto

Jogo online por turnos com **2–4 participantes totais**, aceitando **humanos e robôs (IA) misturados**. Exemplos: 1 humano + 1 robô; 1 humano + 3 robôs; 2 humanos; 2 humanos + 2 robôs; 4 humanos. O bot executa as mesmas ações e obedece às mesmas regras.

## Índice dos documentos

| Arquivo | Tema | Status |
|---|---|---|
| `01-visao-e-componentes.md` | Conceito, peças e configuração | Arquivo ausente; registrado em decisões |
| [02-regras-oficiais.md](02-regras-oficiais.md) | Ações, reservas, descontos, vitória | Fundamentado |
| [03-fluxo-e-turnos.md](03-fluxo-e-turnos.md) | Fluxo e máquina de estados | Proposta digital |
| [04-joias-e-recursos.md](04-joias-e-recursos.md) | Tipos, quantidades e economia | Fundamentado |
| [05-cartas-e-personagens.md](05-cartas-e-personagens.md) | Nomes das **90 cartas** separados por nível | Lista comunitária; validação pendente |
| `06-locais-e-especiais.md` | Locais, Vingadores e Manopla | Arquivo ausente; dados das faces pendentes |
| [07-modos-robo-e-multiplayer.md](07-modos-robo-e-multiplayer.md) | IA, lobby, WebSocket, sincronização | Proposta digital |
| [08-modelagem-e-contratos.md](08-modelagem-e-contratos.md) | Tipos de dados, eventos e validações | Proposta digital |
| `09-testes-e-casos-limite.md` | Casos mínimos de aceite | Arquivo ausente; testes implementados em `src/game/tests` |
| `10-pendencias-e-fontes.md` | Lacunas e fontes verificáveis | Arquivo ausente; substituído por `docs/decisoes-pendentes.md` |
| [cartas.catalogo.json](cartas.catalogo.json) | 90 registros com balanceamento experimental | Fonte de gameplay validada |

## Princípios

1. **Uma fonte de verdade para regras**, compartilhada entre solo/IA e online; nunca duplicar cálculos no navegador.
2. Distinguir **conteúdo oficial confirmado** de **decisões de produto** e de **dados ainda sem verificação**.
3. Nenhuma ficha, carta reservada, bônus, local ou ponto pode surgir/desaparecer sem transição registrada.
4. Manter ordem de baralhos e cartas reservadas ocultas de oponentes.
5. Os nomes Marvel e as regras aqui documentados são referência de pesquisa. **Não presumir licença** para marcas, ilustrações, arte das cartas ou publicação comercial com esses ativos.

## Situação do projeto

- [x] Regras do jogo de mesa extraídas das fontes primárias.
- [x] 90 nomes por nível catalogados de fonte comunitária.
- [x] Quantidades e funcionamento das joias/fichas documentados.
- [x] Fluxo humano x IA e multiplayer proposto.
- [ ] Auditar **90 cartas** (custo, pontos, bônus, símbolos dos Vingadores, imagem).
- [ ] Auditar **8 faces** dos 4 cartões de Local (nome, cor e quantidade exigida).
- [ ] Definir identidade gráfica/licenciamento para publicação.
- [x] Implementar a fundação do motor de regras + testes automatizados.

## Fontes e grau de confiança

- **Regra primária:** [Space Cowboys, manual oficial em inglês (PDF)](https://cdn.svc.asmodee.net/production-spacecowboys/uploads/2025/11/Rules_Splendor_Marvel_EN_compressed.pdf), páginas 1–3. Publicação oficial da editora.
- **Tradução:** [Manual em português (PDF)](https://comparajogos-forum.s3.dualstack.sa-east-1.amazonaws.com/uploads/original/2X/3/322af301ee614024f9f26a0d666a10db365ee8e7.pdf), páginas 1–3.
- **Composição:** [Página da editora Space Cowboys](https://www.spacecowboys-games.com/game/splendor-marvel/).
- **Identidade das 90 cartas por nível:** [Marvel Splendor Card List — Scribd](https://www.scribd.com/document/793036882/Marvel-Splendor-Card-List), **lista comunitária não oficial**, comparada pontualmente com exemplos/fotos públicas. **A lista completa ainda requer auditoria com exemplar físico ou imagens legíveis das 90 cartas.**

**Legenda:** `oficial` = regra/componente confirmado pelo manual; `comunidade_a_validar` = catálogo nominal encontrado, não verificado carta a carta; `pendente` = dado desconhecido. Não tratar `null` como 0.
