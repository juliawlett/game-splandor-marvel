import { CatalogBrowser } from "@/features/game/catalog-browser";
import { cardCatalog } from "@/game/data/catalog";

export default function CatalogPage() {
  return (
    <main className="catalog-page">
      <header className="catalog-heading">
        <div>
          <p className="status-line"><span /> Base local validada</p>
          <h1>Arquivo de personagens</h1>
        </div>
        <p>90 cartas de protótipo com custos e atributos experimentais. Nenhuma imagem ou atributo oficial é reproduzido aqui.</p>
      </header>
      <CatalogBrowser cards={cardCatalog} />
    </main>
  );
}
