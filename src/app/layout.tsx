import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nexus Infinito — desenvolvimento",
  description: "Protótipo local de estratégia por turnos inspirado em Splendor: Marvel.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>
        <header className="site-header">
          <Link href="/" className="brand" aria-label="Nexus Infinito — início">
            <span className="brand-mark" aria-hidden="true">✦</span>
            <span>Nexus Infinito</span>
          </Link>
          <nav aria-label="Navegação principal">
            <Link href="/">Início</Link>
            <Link href="/jogar">Jogar</Link>
            <Link href="/catalogo">Catálogo</Link>
            <span className="dev-chip">versão de desenvolvimento</span>
          </nav>
        </header>
        {children}
        <footer className="site-footer">
          <span>Protótipo independente para execução local.</span>
          <span>Sem artes oficiais · balanceamento experimental</span>
        </footer>
      </body>
    </html>
  );
}
