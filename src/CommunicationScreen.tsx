import {
  communicationCategories, type CommunicationCategory, type CommunicationElement,
} from './communication'
import type { AudioMode } from './audio-mode.mjs'
import { Icon } from './Icon'
import { Visual } from './Visual'
import type { CommunicationPreferences } from './preferences'

type Props = {
  section: 'communication' | 'favorites'
  category: 'Todas' | CommunicationCategory
  onCategoryChange: (category: 'Todas' | CommunicationCategory) => void
  elements: CommunicationElement[]
  favoriteElements: CommunicationElement[]
  preferences: CommunicationPreferences
  message: CommunicationElement[]
  audioMode: AudioMode
  isPlaying: boolean
  onSelect: (element: CommunicationElement) => void
  onToggleFavorite: (elementId: string) => void
  onRemoveMessageItem: (index: number) => void
  onClear: () => void
  onListen: () => void
  onStop: () => void
}

export function CommunicationScreen({
  section, category, onCategoryChange, elements, message, audioMode, isPlaying,
  favoriteElements, preferences,
  onSelect, onToggleFavorite, onRemoveMessageItem, onClear, onListen, onStop,
}: Props) {
  const canPlayMessage = audioMode === 'message' || audioMode === 'both'
  const isSilent = audioMode === 'silent'
  const categories = [...communicationCategories].sort((a, b) => preferences.categoryOrder.indexOf(a) - preferences.categoryOrder.indexOf(b))
  const topFavorites = section === 'communication' && preferences.showFavorites ? favoriteElements : []
  const gridStyle = { '--tile-columns': preferences.columns } as React.CSSProperties

  return <div className={`work-content communication-view tile-size-${preferences.tileSize} presentation-${preferences.presentation}`} style={gridStyle}>
    {section === 'communication' && <nav className="communication-categories" aria-label="Categorias de comunicação">
      <button className={category === 'Todas' ? 'active' : ''} onClick={() => onCategoryChange('Todas')}>Todas</button>
      {categories.map((item) => <button key={item} className={category === item ? 'active' : ''} onClick={() => onCategoryChange(item)}>{item}</button>)}
    </nav>}
    {section === 'favorites' && <h1 className="favorites-title">Favoritas</h1>}
    <div className="communication-layout">
      <section className="library-panel communication-library" aria-label={section === 'favorites' ? 'Elementos favoritos' : 'Elementos de comunicação'}>
        {topFavorites.length > 0 && <><h2 className="favorites-title">Favoritos</h2><div className="tile-grid favorite-tile-grid">{topFavorites.map((element) => <Tile key={element.id} element={element} onSelect={onSelect} onToggleFavorite={onToggleFavorite} />)}</div></>}
        <div className="tile-grid">
          {elements.map((element) => <Tile key={element.id} element={element} onSelect={onSelect} onToggleFavorite={onToggleFavorite} />)}
        </div>
        {!elements.length && !topFavorites.length && <div className="no-favorites"><b>{section === 'favorites' ? 'Nenhum elemento favorito' : 'Nenhum elemento nesta categoria'}</b>{section === 'favorites' && <button onClick={() => onCategoryChange('Todas')}>Voltar às categorias</button>}</div>}
      </section>
      <aside className="message-panel" aria-label="Mensagem em construção">
        <div className="message-heading"><h2>Mensagem</h2><span className="message-mode-label">{audioMode === 'silent' ? 'Sem áudio' : audioMode === 'select' ? 'Som ao selecionar' : audioMode === 'both' ? 'Som ao selecionar e ouvir' : 'Áudio sob demanda'}</span></div>
        <div className={`message-canvas ${message.length ? 'has-message' : ''}`} aria-live="polite">
          {message.length ? <div className="selected-tiles">{message.map((element, index) => <div key={`${element.id}-${index}`} className="selected-tile"><Visual element={element} className="selected-emoji" /><span>{element.name}</span><button aria-label={`Remover ${element.name} da mensagem`} onClick={() => onRemoveMessageItem(index)}>×</button></div>)}</div> : <p className="message-placeholder">Toque em um pictograma para montar sua mensagem.</p>}
        </div>
        {message.length > 0 && <p className="message-spoken-text" aria-label="Texto que será pronunciado">{message.map((element) => element.speechText).join(' ')}</p>}
        <div className="message-actions">
          <button className="clear-button" onClick={onClear} disabled={!message.length}>Limpar</button>
          {isPlaying
            ? <button className="speak-button stop-audio-button" onClick={onStop}>Parar áudio</button>
            : <button className="speak-button" onClick={onListen} disabled={!message.length || !canPlayMessage} aria-label={isSilent ? 'Áudio desativado nas configurações' : 'Ouvir mensagem'}><Icon name="volume" size={18} /> Ouvir mensagem</button>}
        </div>
        {(isSilent || !canPlayMessage) && <p className="message-audio-hint">{isSilent ? 'Áudio desativado nas configurações.' : 'O som toca ao selecionar cada pictograma.'}</p>}
      </aside>
    </div>
  </div>
}

function Tile({ element, onSelect, onToggleFavorite }: { element: CommunicationElement; onSelect: (element: CommunicationElement) => void; onToggleFavorite: (id: string) => void }) {
  return <div className="tile-wrapper">
    <button className="tile" onClick={() => onSelect(element)} aria-label={`Adicionar ${element.name} à mensagem`}>
      <Visual element={element} className="tile-picture" />
      <span className="tile-word">{element.name}</span>
    </button>
    <button className={`favorite-toggle ${element.favorite ? 'favorited' : ''}`} aria-label={element.favorite ? `Remover ${element.name} dos favoritos` : `Adicionar ${element.name} aos favoritos`} onClick={() => onToggleFavorite(element.id)}><Icon name="heart" size={17} /></button>
  </div>
}
