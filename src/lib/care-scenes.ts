export type CareScene = 'institutional' | 'home'

export function getCareScene(value?: string | null): CareScene | null {
  if (value === 'institutional' || value === 'home') {
    return value
  }

  return null
}

export function isHomeAdmissionSource(sourceType?: string | null) {
  return sourceType === 'document-import'
}

export function isHomeEmploymentSource(employmentSource?: string | null) {
  return employmentSource === '第三方合作'
}

export function matchesAdmissionScene(sourceType: string | null | undefined, scene: CareScene | null) {
  if (!scene) {
    return true
  }

  return scene === 'home'
    ? isHomeAdmissionSource(sourceType)
    : !isHomeAdmissionSource(sourceType)
}

export function matchesEmploymentScene(employmentSource: string | null | undefined, scene: CareScene | null) {
  if (!scene) {
    return true
  }

  return scene === 'home'
    ? isHomeEmploymentSource(employmentSource)
    : !isHomeEmploymentSource(employmentSource)
}

export function withSceneQuery(
  href: string,
  scene: CareScene | null,
  extraParams?: Record<string, string | number | null | undefined>,
) {
  const params = new URLSearchParams()

  if (scene) {
    params.set('scene', scene)
  }

  if (extraParams) {
    Object.entries(extraParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null && `${value}`.length > 0) {
        params.set(key, `${value}`)
      }
    })
  }

  const query = params.toString()
  return query ? `${href}?${query}` : href
}