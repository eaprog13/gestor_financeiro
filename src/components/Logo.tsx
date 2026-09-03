// Marca: uma moeda (anel branco + núcleo verde) com as duas barras do "€"
// recortadas ao centro — motivo de "dinheiro do dia a dia", distinto do
// ícone de barras ascendentes do Gestor de Investimento (portefólio/
// crescimento). Mesma composição do favicon gerado em src/app/icon.tsx —
// aqui em SVG (nítido a qualquer tamanho no Nav, e usa var() para seguir o
// tema claro/escuro), lá em divs (Satori não interpreta CSS var(), por isso
// o favicon usa o hex fixo do acento claro).
export function LogoMark({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden className={className}>
      <rect width="32" height="32" rx="8" style={{ fill: "var(--accent)" }} />
      <circle cx="16" cy="16" r="10" fill="white" />
      <circle cx="16" cy="16" r="6.5" style={{ fill: "var(--accent)" }} />
      <rect x="12.3" y="13.3" width="7.4" height="2" rx="1" fill="white" />
      <rect x="12.3" y="17.3" width="7.4" height="2" rx="1" fill="white" />
    </svg>
  );
}

export function Logo({ size = 28, wordmark = true }: { size?: number; wordmark?: boolean }) {
  return (
    <span className="inline-flex min-w-0 items-center gap-2">
      {/* "perspective" tem de estar num ANTEPASSADO do elemento com
          rotateY (ver .animate-moeda em globals.css) para o giro ganhar
          profundidade 3D real — sem isto, rotateY(180deg) só "espelhava"
          a moeda, sem nunca dar a sensação de estar a rodar no espaço. */}
      <span style={{ perspective: 240 }}>
        <LogoMark size={size} className="animate-moeda" />
      </span>
      {wordmark && <span className="hidden truncate font-semibold tracking-tight sm:inline">Gastos</span>}
    </span>
  );
}
