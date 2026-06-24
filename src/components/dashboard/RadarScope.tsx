"use client";

import * as React from "react";

export interface RadarBlip {
  id: string;
  label: string;
  score: number; // 0-100, higher = closer to center (more urgent/valuable)
  tone: "signal" | "scope" | "alert";
}

const TONE_HEX: Record<RadarBlip["tone"], string> = {
  signal: "#F2A93B",
  scope: "#5FD4D0",
  alert: "#F2654B",
}

/** Deterministic pseudo-random angle from a string, so blips don't jump around on re-render. */
function angleFromId(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) % 360;
  return hash;
}

export function RadarScope({
  blips,
  size = 320,
  decorative = false,
}: {
  blips: RadarBlip[];
  size?: number;
  decorative?: boolean;
}) {
  const center = size / 2;
  const maxRadius = size / 2 - 28;
  const rings = [0.25, 0.5, 0.75, 1];

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      width={size}
      height={size}
      role={decorative ? "presentation" : "img"}
      aria-label={decorative ? undefined : "Opportunity radar, blips positioned by opportunity score"}
    >
      <defs>
        <radialGradient id="scopeGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#5FD4D0" stopOpacity="0.16" />
          <stop offset="100%" stopColor="#5FD4D0" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="sweepGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F2A93B" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#F2A93B" stopOpacity="0" />
        </linearGradient>
      </defs>

      <circle cx={center} cy={center} r={maxRadius + 10} fill="url(#scopeGlow)" />

      {rings.map((r) => (
        <circle
          key={r}
          cx={center}
          cy={center}
          r={maxRadius * r}
          fill="none"
          stroke="#1F2B40"
          strokeWidth={1}
        />
      ))}
      <line x1={center} y1={center - maxRadius} x2={center} y2={center + maxRadius} stroke="#1F2B40" strokeWidth={1} />
      <line x1={center - maxRadius} y1={center} x2={center + maxRadius} y2={center} stroke="#1F2B40" strokeWidth={1} />

      {/* Sweep arm */}
      <g style={{ transformOrigin: `${center}px ${center}px` }} className="animate-sweep">
        <path
          d={`M ${center} ${center} L ${center} ${center - maxRadius} A ${maxRadius} ${maxRadius} 0 0 1 ${
            center + maxRadius * Math.sin(Math.PI / 6)
          } ${center - maxRadius * Math.cos(Math.PI / 6)} Z`}
          fill="url(#sweepGradient)"
          opacity={0.5}
        />
      </g>

      {/* Blips */}
      {blips.map((blip) => {
        const angle = (angleFromId(blip.id) * Math.PI) / 180;
        const radius = maxRadius * (1 - blip.score / 100) * 0.92 + 6;
        const x = center + radius * Math.cos(angle);
        const y = center + radius * Math.sin(angle);
        const color = TONE_HEX[blip.tone];
        return (
          <g key={blip.id} className="animate-blip" style={{ transformOrigin: `${x}px ${y}px` }}>
            {!decorative && <title>{`${blip.label} — score ${blip.score}`}</title>}
            <circle cx={x} cy={y} r={5} fill={color} opacity={0.25} />
            <circle cx={x} cy={y} r={3} fill={color} />
          </g>
        );
      })}

      <circle cx={center} cy={center} r={3} fill="#EDEFF4" />
    </svg>
  );
}
