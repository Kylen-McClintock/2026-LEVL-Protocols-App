'use client'

import React, { useState, useMemo } from 'react'
import {
  ProtocolFingerprint,
  LONGEVITY_VECTOR_AXES,
  HALLMARK_OF_AGING_AXES
} from '@/lib/data/protocolFingerprints'
import { RadarMode } from '@/lib/synergy/protocolStackEngine'

export interface ProtocolVectorRadarProps {
  protocols: ProtocolFingerprint[]
  stackedScores?: Record<string, number>
  mode?: RadarMode
  variant?: 'full' | 'thumbnail'
  size?: number // used for thumbnail or custom dimensions
  highlightAxisId?: string | null
  onHoverAxis?: (axisId: string | null) => void
  showLegend?: boolean
}

// Curated high-contrast neon palette for individual protocol outlines
const PROTOCOL_SERIES_COLORS = [
  { stroke: '#A855F7', fill: 'rgba(168, 85, 247, 0.12)', label: 'Purple' }, // Protocol 0
  { stroke: '#06B6D4', fill: 'rgba(6, 182, 212, 0.12)', label: 'Cyan' },     // Protocol 1
  { stroke: '#F59E0B', fill: 'rgba(245, 158, 11, 0.12)', label: 'Amber' },   // Protocol 2
  { stroke: '#EC4899', fill: 'rgba(236, 72, 153, 0.12)', label: 'Rose' },    // Protocol 3
  { stroke: '#3B82F6', fill: 'rgba(59, 130, 246, 0.12)', label: 'Blue' }     // Protocol 4
]

export const ProtocolVectorRadar: React.FC<ProtocolVectorRadarProps> = ({
  protocols,
  stackedScores,
  mode = 'vectors',
  variant = 'full',
  size = 460,
  highlightAxisId = null,
  onHoverAxis,
  showLegend = true
}) => {
  const [hoveredAxis, setHoveredAxis] = useState<string | null>(null)
  const activeHoverAxis = highlightAxisId || hoveredAxis

  const axes = useMemo(() => {
    return mode === 'vectors' ? LONGEVITY_VECTOR_AXES : HALLMARK_OF_AGING_AXES
  }, [mode])

  const numSpokes = axes.length

  // Thumbnail dimensions vs Full dimensions
  const isThumb = variant === 'thumbnail'
  const viewBoxWidth = isThumb ? (size || 72) : 560
  const viewBoxHeight = isThumb ? (size || 72) : 480
  const centerX = viewBoxWidth / 2
  const centerY = viewBoxHeight / 2
  const radius = isThumb ? (viewBoxWidth / 2) - 6 : 155

  // Pre-calculate geometry for each spoke
  const spokeGeometry = useMemo(() => {
    return axes.map((axis, index) => {
      const angle = (index * (2 * Math.PI / numSpokes)) - (Math.PI / 2)
      const cos = Math.cos(angle)
      const sin = Math.sin(angle)

      const xOuter = centerX + radius * cos
      const yOuter = centerY + radius * sin

      // Label coordinate (outside outer ring)
      const labelRadius = radius + (isThumb ? 0 : 34)
      const xLabel = centerX + labelRadius * cos
      const yLabel = centerY + labelRadius * sin

      return {
        axis,
        index,
        angle,
        cos,
        sin,
        xOuter,
        yOuter,
        xLabel,
        yLabel
      }
    })
  }, [axes, numSpokes, centerX, centerY, radius, isThumb])

  // Compute SVG polygon points for an arbitrary score map
  const getPolygonPoints = (scoresMap: Record<string, number>): string => {
    return spokeGeometry
      .map(spoke => {
        const score = Math.max(8, Math.min(100, scoresMap[spoke.axis.id] || 10))
        const rRatio = score / 100
        const x = centerX + (radius * rRatio) * spoke.cos
        const y = centerY + (radius * rRatio) * spoke.sin
        return `${x.toFixed(1)},${y.toFixed(1)}`
      })
      .join(' ')
  }

  // Polygon points for individual protocols
  const protocolPolygons = useMemo(() => {
    return protocols.map((fp, idx) => {
      const scoresMap: Record<string, number> = {}
      axes.forEach(axis => {
        scoresMap[axis.id] = mode === 'vectors'
          ? (fp.vectors as any)[axis.id] || 0
          : (fp.hallmarks as any)[axis.id] || 0
      })

      const color = PROTOCOL_SERIES_COLORS[idx % PROTOCOL_SERIES_COLORS.length]
      return {
        fingerprint: fp,
        points: getPolygonPoints(scoresMap),
        color,
        scoresMap
      }
    })
  }, [protocols, axes, mode, spokeGeometry])

  // Polygon points for the unified Stacked Envelope
  const stackedPolygonPoints = useMemo(() => {
    if (!stackedScores) return null
    return getPolygonPoints(stackedScores)
  }, [stackedScores, spokeGeometry])

  // Currently inspected axis detail
  const activeAxisDetail = useMemo(() => {
    if (!activeHoverAxis) return null
    const foundSpoke = spokeGeometry.find(s => s.axis.id === activeHoverAxis)
    if (!foundSpoke) return null

    const stackedVal = stackedScores ? stackedScores[activeHoverAxis] : undefined
    const protoBreakdown = protocols.map((fp, idx) => {
      const val = mode === 'vectors'
        ? (fp.vectors as any)[activeHoverAxis] || 0
        : (fp.hallmarks as any)[activeHoverAxis] || 0
      return {
        name: fp.name,
        val,
        color: PROTOCOL_SERIES_COLORS[idx % PROTOCOL_SERIES_COLORS.length]
      }
    })

    return {
      axis: foundSpoke.axis,
      stackedVal,
      protoBreakdown
    }
  }, [activeHoverAxis, spokeGeometry, stackedScores, protocols, mode])

  if (isThumb) {
    // Ultra-compact SVG Thumbnail for Protocol Cards
    return (
      <svg
        viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
        className="w-full h-full overflow-visible drop-shadow-md select-none"
      >
        {/* Subtle circular background */}
        <circle cx={centerX} cy={centerY} r={radius} fill="rgba(15, 23, 42, 0.6)" stroke="rgba(255,255,255,0.1)" strokeWidth="0.8" />
        <circle cx={centerX} cy={centerY} r={radius * 0.5} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.6" />

        {/* Spoke lines */}
        {spokeGeometry.map((s, idx) => (
          <line
            key={idx}
            x1={centerX}
            y1={centerY}
            x2={s.xOuter}
            y2={s.yOuter}
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth="0.6"
          />
        ))}

        {/* First protocol polygon */}
        {protocolPolygons.length > 0 && (
          <polygon
            points={protocolPolygons[0].points}
            fill="rgba(168, 85, 247, 0.35)"
            stroke="#A855F7"
            strokeWidth="1.2"
          />
        )}
      </svg>
    )
  }

  // Full interactive radar
  return (
    <div className="relative w-full flex flex-col items-center select-none">
      {/* SVG Canvas */}
      <div className="relative w-full max-w-[540px] aspect-square flex items-center justify-center">
        <svg
          viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
          className="w-full h-full overflow-visible"
        >
          <defs>
            {/* Radiant Stacked Protocols Gradient */}
            <radialGradient id="stackedEnvelopeGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#10B981" stopOpacity="0.45" />
              <stop offset="60%" stopColor="#F59E0B" stopOpacity="0.30" />
              <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.08" />
            </radialGradient>

            {/* Glowing neon filter */}
            <filter id="goldenNeonGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background Concentric Grid Rings */}
          {[0.2, 0.4, 0.6, 0.8, 1.0].map((level, ringIdx) => {
            const ringPoints = spokeGeometry
              .map(spoke => {
                const x = centerX + (radius * level) * spoke.cos
                const y = centerY + (radius * level) * spoke.sin
                return `${x.toFixed(1)},${y.toFixed(1)}`
              })
              .join(' ')

            return (
              <g key={ringIdx}>
                <polygon
                  points={ringPoints}
                  fill={level === 1.0 ? 'rgba(15, 23, 42, 0.5)' : 'none'}
                  stroke={level === 1.0 ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.08)'}
                  strokeWidth={level === 1.0 ? '1.5' : '1'}
                  strokeDasharray={level === 1.0 ? undefined : '3,3'}
                />
                {/* Axis percentage label on top spoke */}
                <text
                  x={centerX + 6}
                  y={centerY - (radius * level) - 2}
                  className="fill-slate-500 font-mono text-[9px] font-bold pointer-events-none"
                >
                  {Math.round(level * 100)}
                </text>
              </g>
            )
          })}

          {/* Radial Spokes */}
          {spokeGeometry.map(spoke => {
            const isHovered = activeHoverAxis === spoke.axis.id
            return (
              <line
                key={spoke.axis.id}
                x1={centerX}
                y1={centerY}
                x2={spoke.xOuter}
                y2={spoke.yOuter}
                stroke={isHovered ? 'rgba(245, 158, 11, 0.8)' : 'rgba(255, 255, 255, 0.12)'}
                strokeWidth={isHovered ? '2' : '1'}
                className="transition-colors duration-150"
              />
            )
          })}

          {/* 1. THE STACKED PROTOCOLS ENVELOPE (Hero Gradient Underlay) */}
          {stackedPolygonPoints && protocols.length > 1 && (
            <g className="animate-in fade-in zoom-in-95 duration-300">
              <polygon
                points={stackedPolygonPoints}
                fill="url(#stackedEnvelopeGlow)"
                stroke="#10B981"
                strokeWidth="2.5"
                filter="url(#goldenNeonGlow)"
                className="transition-all duration-300"
              />
              {/* Gold Accent Overlay Border */}
              <polygon
                points={stackedPolygonPoints}
                fill="none"
                stroke="#F59E0B"
                strokeWidth="1.2"
                strokeDasharray="4,4"
              />
            </g>
          )}

          {/* 2. INDIVIDUAL PROTOCOL POLYGONS (High-Contrast Outlines) */}
          {protocolPolygons.map((poly, idx) => {
            const isPrimary = idx === 0
            return (
              <g key={poly.fingerprint.id} className="transition-opacity duration-200">
                <polygon
                  points={poly.points}
                  fill={poly.color.fill}
                  stroke={poly.color.stroke}
                  strokeWidth={isPrimary ? '2' : '1.8'}
                  strokeDasharray={protocols.length > 1 ? (idx % 2 === 1 ? '4,3' : undefined) : undefined}
                  className="hover:opacity-100 transition-all"
                />
              </g>
            )
          })}

          {/* 3. INTERACTIVE VERTEX ANCHOR NODES & HOVER ZONES */}
          {spokeGeometry.map(spoke => {
            const isHovered = activeHoverAxis === spoke.axis.id
            const stackedScore = stackedScores ? (stackedScores[spoke.axis.id] || 0) : 0
            const nodeRadiusRatio = Math.max(0.08, stackedScore / 100)
            const nodeX = centerX + (radius * nodeRadiusRatio) * spoke.cos
            const nodeY = centerY + (radius * nodeRadiusRatio) * spoke.sin

            return (
              <g
                key={`node_${spoke.axis.id}`}
                className="cursor-pointer group"
                onMouseEnter={() => {
                  setHoveredAxis(spoke.axis.id)
                  if (onHoverAxis) onHoverAxis(spoke.axis.id)
                }}
                onMouseLeave={() => {
                  setHoveredAxis(null)
                  if (onHoverAxis) onHoverAxis(null)
                }}
              >
                {/* Invisible large hit area */}
                <circle
                  cx={spoke.xOuter}
                  cy={spoke.yOuter}
                  r="24"
                  fill="transparent"
                />

                {/* Vertex node indicator on the stacked envelope */}
                {stackedScores && (
                  <circle
                    cx={nodeX}
                    cy={nodeY}
                    r={isHovered ? '6' : '3.5'}
                    fill={isHovered ? '#F59E0B' : '#10B981'}
                    stroke="#0F172A"
                    strokeWidth="1.5"
                    className="transition-all duration-150 drop-shadow"
                  />
                )}

                {/* Outer Axis Label */}
                <text
                  x={spoke.xLabel}
                  y={spoke.yLabel}
                  textAnchor={
                    Math.abs(spoke.cos) < 0.15 ? 'middle' : spoke.cos > 0 ? 'start' : 'end'
                  }
                  dominantBaseline="central"
                  className={`text-[11px] font-extrabold transition-all duration-150 ${
                    isHovered
                      ? 'fill-amber-300 font-mono scale-105'
                      : 'fill-slate-300 hover:fill-white'
                  }`}
                >
                  {spoke.axis.shortLabel || spoke.axis.label}
                </text>
              </g>
            )
          })}
        </svg>

        {/* Hover Tooltip Overlay (Floating over center when hovering an axis) */}
        {activeAxisDetail && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20 w-64 bg-slate-950/95 border border-amber-500/40 rounded-2xl p-3 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-2">
              <span className="text-[11px] font-extrabold text-amber-300 uppercase tracking-wide truncate">
                {activeAxisDetail.axis.label}
              </span>
              {activeAxisDetail.stackedVal !== undefined && (
                <span className="text-xs font-mono font-black text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-md border border-emerald-500/40">
                  {activeAxisDetail.stackedVal}/100
                </span>
              )}
            </div>

            <p className="text-[10px] text-slate-400 leading-tight line-clamp-2 mb-2">
              {activeAxisDetail.axis.description}
            </p>

            {/* Breakdown per selected protocol */}
            <div className="space-y-1 pt-1 border-t border-slate-800/60">
              {activeAxisDetail.protoBreakdown.map((proto, idx) => (
                <div key={idx} className="flex items-center justify-between text-[10px]">
                  <span className="flex items-center gap-1.5 truncate max-w-[150px] text-slate-300">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: proto.color.stroke }} />
                    <span className="truncate">{proto.name}</span>
                  </span>
                  <span className="font-mono font-bold text-white shrink-0">
                    {proto.val} pts
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Protocol Color Legend */}
      {showLegend && (
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2 px-2 text-xs">
          {protocols.map((proto, idx) => {
            const color = PROTOCOL_SERIES_COLORS[idx % PROTOCOL_SERIES_COLORS.length]
            return (
              <div
                key={proto.id}
                className="flex items-center gap-1.5 bg-slate-900/80 border border-slate-800 px-2.5 py-1 rounded-full text-slate-300 font-medium"
              >
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color.stroke }} />
                <span className="truncate max-w-[160px] text-[11px] font-bold text-white">{proto.name}</span>
              </div>
            )
          })}

          {stackedScores && protocols.length > 1 && (
            <div className="flex items-center gap-1.5 bg-emerald-950/60 border border-emerald-500/40 px-3 py-1 rounded-full text-emerald-300 font-extrabold shadow-[0_0_10px_rgba(16,185,129,0.2)]">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] text-emerald-200">Stacked Protocols Envelope</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
