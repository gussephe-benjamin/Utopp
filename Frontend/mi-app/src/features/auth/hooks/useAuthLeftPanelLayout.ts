import { useEffect, useState } from "react"

export type AuthLeftPanelLayout = {
  showBenefits: boolean
  maxEvents: 0 | 1 | 2
  showOrganizations: boolean
  compactSpacing: boolean
  benefitsGrid: boolean
}

function getPanelMetrics(width: number) {
  const splitRatio = width >= 1024 ? 0.55 : 0.52
  const effectivePanelWidth = Math.round(width * splitRatio)
  const horizontalPadding = width >= 1280 ? 96 : 64
  const contentWidth = Math.min(effectivePanelWidth - horizontalPadding, 512)
  return { effectivePanelWidth, contentWidth }
}

function applyNarrowPanelCaps(
  layout: AuthLeftPanelLayout,
  contentWidth: number,
  height: number,
): AuthLeftPanelLayout {
  if (contentWidth >= 560) return layout

  if (height < 820) {
    return { ...layout, maxEvents: 0 }
  }

  if (height < 900 && layout.maxEvents > 1) {
    return { ...layout, maxEvents: 1 }
  }

  return layout
}

function resolveLayout(width: number, height: number): AuthLeftPanelLayout {
  const { contentWidth } = getPanelMetrics(width)
  const compactSpacing = height < 900 || contentWidth < 560
  const benefitsGrid = contentWidth < 560

  if (height <= 580) {
    return {
      showBenefits: false,
      maxEvents: 0,
      showOrganizations: false,
      compactSpacing,
      benefitsGrid,
    }
  }

  let layout: AuthLeftPanelLayout

  if (height > 920 && width >= 1366) {
    layout = {
      showBenefits: true,
      maxEvents: 2,
      showOrganizations: true,
      compactSpacing,
      benefitsGrid,
    }
  } else if (height > 800 || width >= 1200) {
    layout = {
      showBenefits: true,
      maxEvents: 2,
      showOrganizations: height >= 820,
      compactSpacing,
      benefitsGrid,
    }
  } else if (height > 740 || width >= 1024) {
    layout = {
      showBenefits: true,
      maxEvents: 1,
      showOrganizations: false,
      compactSpacing,
      benefitsGrid,
    }
  } else {
    layout = {
      showBenefits: true,
      maxEvents: 0,
      showOrganizations: false,
      compactSpacing,
      benefitsGrid,
    }
  }

  return applyNarrowPanelCaps(layout, contentWidth, height)
}

/** Layout del panel izquierdo según prioridad: benefits > eventos > orgs. */
export function useAuthLeftPanelLayout(): AuthLeftPanelLayout {
  const [layout, setLayout] = useState<AuthLeftPanelLayout>(() => {
    if (typeof window === "undefined") {
      return resolveLayout(1440, 900)
    }
    return resolveLayout(window.innerWidth, window.innerHeight)
  })

  useEffect(() => {
    const update = () => setLayout(resolveLayout(window.innerWidth, window.innerHeight))

    update()
    window.addEventListener("resize", update)
    return () => window.removeEventListener("resize", update)
  }, [])

  return layout
}
