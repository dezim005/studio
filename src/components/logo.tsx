
import type { SVGProps } from 'react';
import { cn } from '@/lib/utils';

// New Logo component using an inline SVG
export function Logo({ className, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  const tealColor = "#1F998C";

  return (
    <div className={cn("flex items-center", className)} aria-label="Vaga Livre" {...rest}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 284 44" // Aspect ratio based on the provided image
        className="h-8 w-auto" // Default sizing, can be overridden
        fill={tealColor} // Teal color from the image
      >
        {/* Icon part - Simplified pixelated representation */}
        <path d="M4 4h28v4h-28z M12 8h12v4h-12z M4 12h28v20h-28z M8 16h20v4h-20z M8 24h20v4h-20z M12 32h12v4h-12z M4 36h28v4h-28z" />

        {/* V (Starting x=40) */}
        <path d="M40 12h4v16h-4v4h4v4h4v-4h4v-4h4v-16h4v16h-4v4h-4v4h-4v-4h-4v-4h-4z" />
        {/* A (Starting x=68) */}
        <path d="M68 20h4v12h-4z M72 16h4v4h-4z M76 12h4v4h-4z M80 16h4v4h-4z M84 20h4v12h-4z M76 24h4v4h-4z" />
        {/* G (Starting x=96) */}
        <path d="M100 12h12v4h-12z M96 16h4v12h-4z M112 16h4v8h-4z M104 24h8v4h-8z M96 28h4v4h-4z M100 32h12v4h-12z" />
        {/* A (Starting x=124) */}
        <path d="M124 20h4v12h-4z M128 16h4v4h-4z M132 12h4v4h-4z M136 16h4v4h-4z M140 20h4v12h-4z M132 24h4v4h-4z" />

        {/* Space (4px wide) */}

        {/* L (Starting x=156) */}
        <path d="M156 12h4v24h-4z M156 32h12v4h-12z" />
        {/* I (Starting x=172) */}
        <path d="M176 12h4v24h-4z" />
        {/* V (Starting x=184) */}
        <path d="M184 12h4v16h-4v4h4v4h4v-4h4v-4h4v-16h4v16h-4v4h-4v4h-4v-4h-4v-4h-4z" />
        {/* R (Starting x=212) */}
        <path d="M212 12h4v24h-4z M216 12h8v4h-8z M224 16h4v4h-4z M216 20h8v4h-8z M220 24h4v4h-4z M224 28h4v8h-4z" />
        {/* E (Starting x=236) */}
        <path d="M236 12h16v4h-16z M236 12h4v24h-4z M236 20h12v4h-12z M236 32h16v4h-16z" />
      </svg>
    </div>
  );
}
