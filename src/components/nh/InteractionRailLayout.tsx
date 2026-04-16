import React from 'react'

interface InteractionRailLayoutProps {
  main: React.ReactNode
  rail: React.ReactNode
  className?: string
  mainClassName?: string
  railClassName?: string
}

export function InteractionRailLayout({
  main,
  rail,
  className = '',
  mainClassName = '',
  railClassName = '',
}: InteractionRailLayoutProps) {
  return (
    <div className={`interaction-layout ${className}`.trim()}>
      <div className={`interaction-layout-main ${mainClassName}`.trim()}>{main}</div>
      <aside className={`interaction-layout-rail ${railClassName}`.trim()}>{rail}</aside>
    </div>
  )
}