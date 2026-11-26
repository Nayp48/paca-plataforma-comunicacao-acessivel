export function getCommunicationGroups(elements, category, showFavorites, favoritesPage = false) {
  if (favoritesPage) {
    return { favorites: [], elements: elements.filter((item) => item.favorite) }
  }
  const favorites = showFavorites ? elements.filter((item) => item.favorite) : []
  const remaining = showFavorites ? elements.filter((item) => !item.favorite) : elements
  return {
    favorites,
    elements: remaining.filter((item) => category === 'Todas' || item.category === category),
  }
}
