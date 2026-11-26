export type CommunicationCategory = 'Necessidades' | 'Sentimentos' | 'Ações' | 'Pessoas' | 'Lugares'
export type VisualType = 'pictogram' | 'emoji' | 'photo'

export type CommunicationElement = {
  id: string
  name: string
  category: CommunicationCategory
  visualType: VisualType
  pictogram: string
  emoji: string
  image?: string
  speechText: string
  essential: boolean
  favorite: boolean
  color: string
}

export const communicationCategories: CommunicationCategory[] = ['Necessidades', 'Sentimentos', 'Ações', 'Pessoas', 'Lugares']

export const pictograms = [
  ['person', 'Pessoa'], ['want', 'Querer'], ['need', 'Precisar'], ['water', 'Água'],
  ['food', 'Comer'], ['toilet', 'Banheiro'], ['happy', 'Feliz'], ['sad', 'Triste'],
  ['help', 'Ajuda'], ['rest', 'Descansar'], ['mother', 'Mamãe'], ['no', 'Não'],
] as const

export const emojiChoices = ['🙋', '💭', '🫶', '💧', '🍽️', '🚻', '😊', '😔', '🆘', '🛋️', '👩', '✋', '❤️', '👍', '🏠', '🌳', '🎨', '📚', '🚗', '🐶']

export const initialElements: CommunicationElement[] = [
  { id: 'person-me', name: 'Eu', category: 'Pessoas', visualType: 'pictogram', pictogram: 'person', emoji: '🙋', speechText: 'Eu', essential: true, favorite: false, color: 'lilac' },
  { id: 'want', name: 'Quero', category: 'Ações', visualType: 'pictogram', pictogram: 'want', emoji: '💭', speechText: 'Quero', essential: true, favorite: false, color: 'peach' },
  { id: 'need', name: 'Preciso', category: 'Necessidades', visualType: 'pictogram', pictogram: 'need', emoji: '🫶', speechText: 'Preciso', essential: true, favorite: false, color: 'mint' },
  { id: 'water', name: 'Água', category: 'Necessidades', visualType: 'pictogram', pictogram: 'water', emoji: '💧', speechText: 'Água', essential: true, favorite: false, color: 'blue' },
  { id: 'food', name: 'Comer', category: 'Necessidades', visualType: 'pictogram', pictogram: 'food', emoji: '🍽️', speechText: 'Comer', essential: true, favorite: false, color: 'yellow' },
  { id: 'toilet', name: 'Banheiro', category: 'Lugares', visualType: 'pictogram', pictogram: 'toilet', emoji: '🚻', speechText: 'Banheiro', essential: true, favorite: false, color: 'lilac' },
  { id: 'happy', name: 'Feliz', category: 'Sentimentos', visualType: 'pictogram', pictogram: 'happy', emoji: '😊', speechText: 'Feliz', essential: true, favorite: false, color: 'yellow' },
  { id: 'sad', name: 'Triste', category: 'Sentimentos', visualType: 'pictogram', pictogram: 'sad', emoji: '😔', speechText: 'Triste', essential: true, favorite: false, color: 'blue' },
  { id: 'help', name: 'Ajuda', category: 'Necessidades', visualType: 'pictogram', pictogram: 'help', emoji: '🆘', speechText: 'Ajuda', essential: true, favorite: false, color: 'peach' },
  { id: 'rest', name: 'Descansar', category: 'Ações', visualType: 'pictogram', pictogram: 'rest', emoji: '🛋️', speechText: 'Descansar', essential: true, favorite: false, color: 'mint' },
  { id: 'mother', name: 'Mamãe', category: 'Pessoas', visualType: 'pictogram', pictogram: 'mother', emoji: '👩', speechText: 'Mamãe', essential: true, favorite: false, color: 'peach' },
  { id: 'no', name: 'Não', category: 'Ações', visualType: 'pictogram', pictogram: 'no', emoji: '✋', speechText: 'Não', essential: true, favorite: false, color: 'lilac' },
]

export function restoreElements(): CommunicationElement[] {
  try {
    const stored = localStorage.getItem('paca.communication.elements.v1')
    if (!stored) return initialElements
    const parsed: unknown = JSON.parse(stored)
    if (!Array.isArray(parsed)) return initialElements
    const seeded = new Map(initialElements.map((item) => [item.id, item]))
    const userElements = parsed.filter((item): item is CommunicationElement =>
      typeof item === 'object' && item !== null && typeof item.id === 'string' &&
      typeof item.name === 'string' && typeof item.speechText === 'string' &&
      communicationCategories.includes(item.category) && ['pictogram', 'emoji', 'photo'].includes(item.visualType),
    )
    for (const item of userElements) {
      if (seeded.has(item.id)) seeded.set(item.id, { ...seeded.get(item.id)!, ...item, essential: true })
      else seeded.set(item.id, { ...item, essential: false })
    }
    return [...seeded.values()]
  } catch {
    return initialElements
  }
}

export function pictogramUrl(name: string) {
  return `/pictograms/symbols.svg#${name}`
}
