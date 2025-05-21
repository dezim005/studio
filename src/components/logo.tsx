
import type { SVGProps } from 'react';
import { cn } from '@/lib/utils';

export function Logo({ className, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  const tealColor = "#1F998C"; // Cor teal da imagem

  return (
    <div className={cn("flex items-center", className)} aria-label="Vaga Livre" {...rest}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 284 44" // Mantendo o viewBox para consistência de proporção
        className="h-8 w-auto" // Default sizing, can be overridden
        fill={tealColor}
      >
        {/* Ícone (redesenhado para ser suave) */}
        <g>
          {/* Pilar Esquerdo */}
          <path d="M4,2 H10 V42 H4 Z" />
          {/* Braço Superior */}
          <path d="M10,2 H32 V8 H10 Z" />
          {/* Vertical Superior Direita */}
          <path d="M26,8 V19 H32 V8 Z" />
          {/* Braço do Meio */}
          <path d="M10,19 H32 V25 H10 Z" />
          {/* Vertical Inferior Direita */}
          <path d="M26,25 V36 H32 V25 Z" />
          {/* Braço Inferior */}
          <path d="M10,36 H32 V42 H10 Z" />
        </g>

        {/* Texto "VAGA LIVRE" (redesenhado para ser suave) - y de 6 a 38 (altura 32) */}
        {/* V (x=40, w=22) */}
        <path d="M40,6 L46,6 L51,27 L56,6 L62,6 L54,38 L48,38 Z" />
        {/* A (x=66, w=22) */}
        <path d="M66,38 L71.5,6 H82.5 L88,38 H83 L81.5,28 H72.5 L71,38 H66 Z M72.5,21 H81.5 V25 H72.5 Z" />
        {/* G (x=92, w=22) */}
        <path d="M114,14 C114,9 111,6 103,6 C95,6 92,10 92,17 V27 C92,34 95,38 103,38 C109,38 114,35 114,30 H108 V26 H103 V32 H108 C108,33 107,34 103,34 C97,34 96,30 96,27 V17 C96,11 97,9 103,9 C107,9 108,10 108,14Z M103,19 H110 V23 H103Z" />
        {/* A (x=118, w=22) */}
        <path d="M118,38 L123.5,6 H134.5 L140,38 H135 L133.5,28 H124.5 L123,38 H118 Z M124.5,21 H133.5 V25 H124.5 Z" />

        {/* L (x=148, w=18) - Espaço de palavra antes */}
        <path d="M148,6 H154 V38 H148 Z M148,32 H166 V38 H148 Z" />
        {/* I (x=170, w=6) */}
        <path d="M170,6 H176 V38 H170 Z" />
        {/* V (x=180, w=22) */}
        <path d="M180,6 L186,6 L191,27 L196,6 L202,6 L194,38 L188,38 Z" />
        {/* R (x=206, w=20) */}
        <path d="M206,6 V38 H212 V6 H206 Z M211,6 H221 Q226,6 226,12 Q226,18 221,18 H211 V14 H221 Q223,14 223,12 Q223,10 221,10 H211 V6 Z M214,18 L218,18 L226,38 L220,38 L214,21 V18 Z" />
        {/* E (x=230, w=18) */}
        <path d="M230,6 H236 V38 H230 Z M236,6 H248 V12 H236 Z M236,19 H245 V25 H236 Z M236,32 H248 V38 H236 Z" />
      </svg>
    </div>
  );
}
