import Link from "next/link";

const stones = ["Mente", "Espaço", "Alma", "Poder", "Realidade", "Tempo"];

export default function HomePage() {
  return (
    <main>
      <section className="hero">
        <div className="hero-copy">
          <p className="status-line"><span /> Motor de regras em construção</p>
          <h1>Reúna poder.<br />Construa o seu universo.</h1>
          <p className="hero-intro">
            Um jogo local de estratégia por turnos para 2 a 4 participantes.
            Recrute personagens, acumule bônus e complete a Manopla antes dos rivais.
          </p>
          <div className="hero-actions">
            <Link className="primary-link" href="/catalogo">Explorar as 90 cartas</Link>
            <a className="text-link" href="#como-funciona">Entender as regras</a>
          </div>
        </div>
        <div className="cosmic-core" aria-label="Seis recursos orbitando o núcleo do jogo">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="core-glyph">∞</div>
          {stones.map((stone, index) => <span className={`stone stone-${index + 1}`} key={stone} title={stone} />)}
          <p>16 pontos<br /><strong>+ Manopla</strong></p>
        </div>
      </section>

      <section className="mode-section" aria-labelledby="modos-title">
        <div className="section-heading">
          <h2 id="modos-title">Escolha de modalidade</h2>
          <p>As duas modalidades compartilharão o mesmo motor. Nesta etapa, a fundação está pronta para receber as partidas.</p>
        </div>
        <div className="mode-grid">
          <article className="mode-panel mode-active">
            <div className="mode-symbol" aria-hidden="true">◉</div>
            <div>
              <h3>Contra robôs</h3>
              <p>Um jogador humano e até três adversários automatizados, todos sujeitos às mesmas regras.</p>
              <span className="availability">Estrutura preparada · jogabilidade na próxima etapa</span>
            </div>
          </article>
          <article className="mode-panel mode-disabled">
            <div className="mode-symbol" aria-hidden="true">◇</div>
            <div>
              <h3>Multiplayer</h3>
              <p>Partidas futuras entre 2 e 4 pessoas, com estado autoritativo e informações privadas.</p>
              <span className="availability">Indisponível nesta versão</span>
            </div>
          </article>
        </div>
      </section>

      <section className="rules-section" id="como-funciona" aria-labelledby="rules-title">
        <div className="section-heading">
          <h2 id="rules-title">Uma ação muda o tabuleiro</h2>
          <p>Em cada turno, escolha uma única ação principal. O motor cuida do restante.</p>
        </div>
        <ol className="rule-flow">
          <li><span>Pegar</span><p>Recolha três recursos diferentes ou dois iguais quando houver estoque suficiente.</p></li>
          <li><span>Reservar</span><p>Proteja uma carta para depois e receba um curinga S.H.I.E.L.D., se disponível.</p></li>
          <li><span>Recrutar</span><p>Pague custos com fichas e descontos permanentes para somar poder e pontos.</p></li>
          <li><span>Conquistar</span><p>Controle Locais, assuma o cartão Vingadores e cumpra a Manopla do Infinito.</p></li>
        </ol>
      </section>
    </main>
  );
}
