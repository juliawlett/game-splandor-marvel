# Documentação inicial — jogo digital inspirado em Splendor: Marvel

> Versão 0.1 — 22/10/2026. Idioma: pt-BR. Objetivo: especificar regras, fluxos e dados **antes de desenvolver**. Este material descreve o jogo de mesa como referência e propõe uma adaptação digital; não é um produto oficial ou licenciado.

## Objetivo do projeto

Jogo online por turnos com **2–4 participantes totais**, aceitando **humanos e robôs (IA) misturados**. Exemplos: 1 humano + 1 robô; 1 humano + 3 robôs; 2 humanos; 2 humanos + 2 robôs; 4 humanos. O bot executa as mesmas ações e obedece às mesmas regras.

## Índice dos documentos

| Arquivo | Tema | Status |
|---|---|---|
| [01-visao-e-componentes.md](01-visao-e-componentes.md) | Conceito, peças e configuração | Fundamentado |
| [02-regras-oficiais.md](02-regras-oficiais.md) | Ações, reservas, descontos, vitória | Fundamentado |
| [03-fluxo-e-turnos.md](03-fluxo-e-turnos.md) | Fluxo e máquina de estados | Proposta digital |
| [04-joias-e-recursos.md](04-joias-e-recursos.md) | Tipos, quantidades e economia | Fundamentado |
| [05-cartas-e-personagens.md](05-cartas-e-personagens.md) | Nomes das **90 cartas** separados por nível | Lista comunitária; validação pendente |
| [06-locais-e-especiais.md](06-locais-e-especiais.md) | Locais, Vingadores e Manopla | Regras fundamentadas; dados das faces pendentes |
| [07-modos-robo-e-multiplayer.md](07-modos-robo-e-multiplayer.md) | IA, lobby, WebSocket, sincronização | Proposta digital |
| [08-modelagem-e-contratos.md](08-modelagem-e-contratos.md) | Tipos de dados, eventos e validações | Proposta digital |
| [09-testes-e-casos-limite.md](09-testes-e-casos-limite.md) | Casos mínimos de aceite | Proposta digital |
| [10-pendencias-e-fontes.md](10-pendencias-e-fontes.md) | Lacunas e fontes verificáveis | Aberto |
| [data/cartas.catalogo.json](data/cartas.catalogo.json) | 90 registros nome/nível, campos desconhecidos nulos | Rascunho de dados |

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
- [ ] Implementar motor de regras + testes.

## Fontes e grau de confiança

- **Regra primária:** [Space Cowboys, manual oficial em inglês (PDF)](https://cdn.svc.asmodee.net/production-spacecowboys/uploads/2025/11/Rules_Splendor_Marvel_EN_compressed.pdf), páginas 1–3. Publicação oficial da editora.
- **Tradução:** [Manual em português (PDF)](https://comparajogos-forum.s3.dualstack.sa-east-1.amazonaws.com/uploads/original/2X/3/322af301ee614024f9f26a0d666a10db365ee8e7.pdf), páginas 1–3.
- **Composição:** [Página da editora Space Cowboys](https://www.spacecowboys-games.com/game/splendor-marvel/).
- **Identidade das 90 cartas por nível:** [Marvel Splendor Card List — Scribd](https://www.scribd.com/document/793036882/Marvel-Splendor-Card-List), **lista comunitária não oficial**, comparada pontualmente com exemplos/fotos públicas. **A lista completa ainda requer auditoria com exemplar físico ou imagens legíveis das 90 cartas.**

**Legenda:** `oficial` = regra/componente confirmado pelo manual; `comunidade_a_validar` = catálogo nominal encontrado, não verificado carta a carta; `pendente` = dado desconhecido. Não tratar `null` como 0.
