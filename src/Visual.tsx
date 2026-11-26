import { pictogramUrl, type CommunicationElement } from './communication'

export function Visual({ element, className = '' }: { element: CommunicationElement; className?: string }) {
  if (element.visualType === 'photo' && element.image) {
    return <span className={`element-visual ${element.color} ${className}`}><img src={element.image} alt="" /></span>
  }
  if (element.visualType === 'emoji') {
    return <span className={`element-visual ${element.color} ${className}`} role="img" aria-label={element.name}>{element.emoji}</span>
  }
  return <span className={`element-visual ${element.color} ${className}`} role="img" aria-label={element.name}><svg><use href={pictogramUrl(element.pictogram)} /></svg></span>
}
