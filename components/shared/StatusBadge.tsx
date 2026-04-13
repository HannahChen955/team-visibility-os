'use client'

interface StatusBadgeProps {
  name: string
  colorHex: string
  size?: 'sm' | 'md'
}

export function StatusBadge({ name, colorHex, size = 'md' }: StatusBadgeProps) {
  const padding = size === 'sm' ? 'px-1.5 py-0.5 text-xs' : 'px-2.5 py-1 text-sm'
  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${padding}`}
      style={{
        backgroundColor: colorHex + '33',   // 20% opacity bg
        color: darkenHex(colorHex, 60),      // dark text from same hue
        border: `1px solid ${colorHex}`,
      }}
    >
      {name}
    </span>
  )
}

/** Darken a hex color for readable text */
function darkenHex(hex: string, amount: number): string {
  const r = Math.max(0, parseInt(hex.slice(1, 3), 16) - amount)
  const g = Math.max(0, parseInt(hex.slice(3, 5), 16) - amount)
  const b = Math.max(0, parseInt(hex.slice(5, 7), 16) - amount)
  return `rgb(${r},${g},${b})`
}
