import type { CommunicationCategory, CommunicationElement } from './communication'

export declare function getCommunicationGroups(
  elements: CommunicationElement[],
  category: 'Todas' | CommunicationCategory,
  showFavorites: boolean,
  favoritesPage?: boolean,
): { favorites: CommunicationElement[]; elements: CommunicationElement[] }
