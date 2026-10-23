# 04 — Joias, cores, fichas e economia

## Tipos confirmados

| Chave de dados | Joia/recurso | Cor | Total físico | Quantidade com 2/3/4 jogadores | Uso |
|---|---|---|---:|---|---|
| `yellow` | Mente | Amarelo | 7 | 4 / 5 / 7 | Comprar cartas; pode ter bônus permanente |
| `blue` | Espaço | Azul | 7 | 4 / 5 / 7 | Comprar cartas; pode ter bônus permanente |
| `orange` | Alma | Laranja | 7 | 4 / 5 / 7 | Comprar cartas; pode ter bônus permanente |
| `purple` | Poder | Roxo | 7 | 4 / 5 / 7 | Comprar cartas; pode ter bônus permanente |
| `red` | Realidade | Vermelho | 7 | 4 / 5 / 7 | Comprar cartas; pode ter bônus permanente |
| `green` | Tempo | Verde | 4 | 2 / 3 / 4 | Requisito especial de vitória; **não paga cartas** |
| `gray` | S.H.I.E.L.D. | Cinza | 5 | 5 / 5 / 5 | Curinga consumível; só obtido ao reservar carta |

**Contagem:** 35 fichas comuns + 4 verdes = **39 Joias do Infinito**; mais 5 cinzas = **44 fichas no conjunto**.

## Restrições de coleção

- As **cinco cores comuns** são as únicas obtidas pela ação de pegar fichas.
- A ficha `gray` substitui **uma ficha comum faltante** no pagamento (qualquer das cinco cores).
- A ficha `green` só é concedida ao primeiro recrutamento de personagem nível 3: um por jogador, não transferível, nem descartável.
- As sete cores contam para o limite total **10 por jogador**.
- Fichas comuns/cinzas gastas ou devolvidas retornam ao banco; verdes nunca retornam via escolha de descarte.
- Os **bônus permanentes** ficam nas cartas recrutadas e **não** representam fichas móveis.

## Invariantes de recursos para testes

Para cada cor `c`, `supplyInitial[c]` é o estoque ativo no início da partida:

```
bank[c] + soma(tokens[player][c] para todos os jogadores) = supplyInitial[c]
```

Respeitar estoques na transição de ação e reserva; nunca permitir negativos. Fichas retiradas do jogo na preparação não devem participar da equação. O número verde corresponde ao número de jogadores ativos e não pode exceder 1 por pessoa.

## Sobre a Manopla

Ela exige **um bônus de cada cor comum**, e não uma ficha física guardada de cada cor. Também exige **uma ficha verde de Tempo**. Algumas descrições comerciais brasileiras trocam 'Tempo' por 'Mente' no texto da vitória; a **referência primária é o manual**, que mostra a ficha verde.

## Fontes e grau de confiança

- **Regra primária:** [Space Cowboys, manual oficial em inglês (PDF)](https://cdn.svc.asmodee.net/production-spacecowboys/uploads/2025/11/Rules_Splendor_Marvel_EN_compressed.pdf), páginas 1–3. Publicação oficial da editora.
- **Tradução:** [Manual em português (PDF)](https://comparajogos-forum.s3.dualstack.sa-east-1.amazonaws.com/uploads/original/2X/3/322af301ee614024f9f26a0d666a10db365ee8e7.pdf), páginas 1–3.
- **Composição:** [Página da editora Space Cowboys](https://www.spacecowboys-games.com/game/splendor-marvel/).
- **Identidade das 90 cartas por nível:** [Marvel Splendor Card List — Scribd](https://www.scribd.com/document/793036882/Marvel-Splendor-Card-List), **lista comunitária não oficial**, comparada pontualmente com exemplos/fotos públicas. **A lista completa ainda requer auditoria com exemplar físico ou imagens legíveis das 90 cartas.**

**Legenda:** `oficial` = regra/componente confirmado pelo manual; `comunidade_a_validar` = catálogo nominal encontrado, não verificado carta a carta; `pendente` = dado desconhecido. Não tratar `null` como 0.
