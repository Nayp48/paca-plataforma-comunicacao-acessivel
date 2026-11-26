import { communicationCategories, type CommunicationCategory } from './communication'

export const communicationPreferencesKey = 'paca.settings.communication.v1'
export const accessibilityPreferencesKey = 'paca.settings.accessibility.v1'
export const profileStorageKey = 'paca.profile.local.v1'

export type CommunicationPreferences = {
  tileSize: 'small' | 'medium' | 'large'
  columns: 3 | 4 | 5 | 6
  categoryOrder: CommunicationCategory[]
  showFavorites: boolean
  presentation: 'complete' | 'compact' | 'visual'
}

export type AccessibilityPreferences = {
  theme: 'light' | 'dark'
  highContrast: boolean
  reducedMotion: boolean
  textSize: 'normal' | 'large' | 'xlarge'
  lowStimulus: boolean
  spacing: 'normal' | 'comfortable' | 'wide'
}

export type LocalProfile = {
  displayName: string
  preferredName: string
  photo: string
  description: string
  neurodivergences: string[]
  otherNeurodivergence: string
  disabilities: string[]
  otherDisability: string
  communicationPreferences: string[]
  otherCommunicationPreference: string
}

export const defaultCommunicationPreferences: CommunicationPreferences = {
  tileSize: 'medium', columns: 4, categoryOrder: communicationCategories,
  showFavorites: true, presentation: 'complete',
}

export const defaultAccessibilityPreferences: AccessibilityPreferences = {
  theme: 'light', highContrast: false, reducedMotion: false,
  textSize: 'normal', lowStimulus: false, spacing: 'normal',
}

export const emptyLocalProfile: LocalProfile = {
  displayName: '', preferredName: '', photo: '', description: '', neurodivergences: [],
  otherNeurodivergence: '', disabilities: [], otherDisability: '',
  communicationPreferences: [], otherCommunicationPreference: '',
}

function readStored<T extends object>(key: string, defaults: T): T {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(key) ?? 'null')
    if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return defaults
    return { ...defaults, ...saved }
  } catch { return defaults }
}

export function readCommunicationPreferences(): CommunicationPreferences {
  const saved = readStored(communicationPreferencesKey, defaultCommunicationPreferences)
  const order = Array.isArray(saved.categoryOrder) ? saved.categoryOrder.filter((item): item is CommunicationCategory => communicationCategories.includes(item)) : []
  return {
    tileSize: ['small', 'medium', 'large'].includes(saved.tileSize) ? saved.tileSize : defaultCommunicationPreferences.tileSize,
    columns: [3, 4, 5, 6].includes(saved.columns) ? saved.columns : defaultCommunicationPreferences.columns,
    categoryOrder: [...new Set([...order, ...communicationCategories])],
    showFavorites: typeof saved.showFavorites === 'boolean' ? saved.showFavorites : defaultCommunicationPreferences.showFavorites,
    presentation: ['complete', 'compact', 'visual'].includes(saved.presentation) ? saved.presentation : defaultCommunicationPreferences.presentation,
  }
}

export function readAccessibilityPreferences(): AccessibilityPreferences {
  const saved = readStored(accessibilityPreferencesKey, defaultAccessibilityPreferences)
  return {
    theme: saved.theme === 'dark' ? 'dark' : 'light',
    highContrast: typeof saved.highContrast === 'boolean' ? saved.highContrast : false,
    reducedMotion: typeof saved.reducedMotion === 'boolean' ? saved.reducedMotion : false,
    textSize: ['normal', 'large', 'xlarge'].includes(saved.textSize) ? saved.textSize : 'normal',
    lowStimulus: typeof saved.lowStimulus === 'boolean' ? saved.lowStimulus : false,
    spacing: ['normal', 'comfortable', 'wide'].includes(saved.spacing) ? saved.spacing : 'normal',
  }
}

export function readLocalProfile(): LocalProfile {
  const saved = readStored(profileStorageKey, emptyLocalProfile)
  return {
    displayName: typeof saved.displayName === 'string' ? saved.displayName : '',
    preferredName: typeof saved.preferredName === 'string' ? saved.preferredName : '',
    photo: typeof saved.photo === 'string' ? saved.photo : '',
    description: typeof saved.description === 'string' ? saved.description : '',
    neurodivergences: Array.isArray(saved.neurodivergences) ? saved.neurodivergences.filter((value): value is string => typeof value === 'string') : [],
    otherNeurodivergence: typeof saved.otherNeurodivergence === 'string' ? saved.otherNeurodivergence : '',
    disabilities: Array.isArray(saved.disabilities) ? saved.disabilities.filter((value): value is string => typeof value === 'string') : [],
    otherDisability: typeof saved.otherDisability === 'string' ? saved.otherDisability : '',
    communicationPreferences: Array.isArray(saved.communicationPreferences) ? saved.communicationPreferences.filter((value): value is string => typeof value === 'string') : [],
    otherCommunicationPreference: typeof saved.otherCommunicationPreference === 'string' ? saved.otherCommunicationPreference : '',
  }
}
