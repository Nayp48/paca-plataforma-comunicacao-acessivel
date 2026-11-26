import { StrictMode, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import {
  communicationCategories, emojiChoices, pictograms, pictogramUrl,
  restoreElements, type CommunicationCategory, type CommunicationElement, type VisualType,
} from './communication'
import { AudioEditor } from './AudioEditor'
import { AccountSections } from './AccountSections'
import { CommunicationScreen } from './CommunicationScreen'
import { getCommunicationGroups } from './communication-view.mjs'
import { audioModeBehavior, playSequentially, playWithAudioFallback, readAudioMode, writeAudioMode, type AudioMode } from './audio-mode.mjs'
import { deleteAllElementAudio, deleteElementAudio, getElementAudio, listElementAudioIds } from './audio-storage'
import { accessibilityPreferencesKey, communicationPreferencesKey, readAccessibilityPreferences, readCommunicationPreferences, type AccessibilityPreferences, type CommunicationPreferences } from './preferences'
import { Icon } from './Icon'
import { Visual } from './Visual'
import './styles.css'

type Screen = 'welcome' | 'access' | 'app'
type Section = 'communication' | 'favorites' | 'editing' | 'profile' | 'settings'
type PlaybackSession = { cancelled: boolean; audio?: HTMLAudioElement; objectUrl?: string; utterance?: SpeechSynthesisUtterance; finishCurrent?: () => void }

function makeDraft(element?: CommunicationElement): CommunicationElement {
  return element ? { ...element } : {
    id: `custom-${Date.now()}`, name: '', category: 'Necessidades', visualType: 'pictogram',
    pictogram: 'need', emoji: '🫶', speechText: '', essential: false, favorite: false, color: 'mint',
  }
}

function resizeImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const source = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => {
      const scale = Math.min(1, 640 / Math.max(image.width, image.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, Math.round(image.width * scale))
      canvas.height = Math.max(1, Math.round(image.height * scale))
      const context = canvas.getContext('2d')
      if (!context) { URL.revokeObjectURL(source); reject(new Error('Não foi possível preparar esta imagem.')); return }
      context.drawImage(image, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(source)
      resolve(canvas.toDataURL('image/jpeg', 0.82))
    }
    image.onerror = () => { URL.revokeObjectURL(source); reject(new Error('Não foi possível abrir esta imagem.')) }
    image.src = source
  })
}

function App() {
  const [screen, setScreen] = useState<Screen>('welcome')
  const [accessMode, setAccessMode] = useState<'login' | 'signup'>('signup')
  const [section, setSection] = useState<Section>('communication')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [category, setCategory] = useState<'Todas' | CommunicationCategory>('Todas')
  const [elements, setElements] = useState<CommunicationElement[]>(restoreElements)
  const [messageIds, setMessageIds] = useState<string[]>([])
  const [draft, setDraft] = useState<CommunicationElement | null>(null)
  const [editorCategory, setEditorCategory] = useState<'Todas' | CommunicationCategory>('Todas')
  const [notice, setNotice] = useState('')
  const [audioMode, setAudioMode] = useState<AudioMode>(readAudioMode)
  const [speechRate, setSpeechRate] = useState(() => { try { const value = Number(localStorage.getItem('paca.settings.speech-rate.v1')); return Number.isFinite(value) && value >= 0.6 && value <= 1.4 ? value : 0.88 } catch { return 0.88 } })
  const [volume, setVolume] = useState(() => { try { const stored = localStorage.getItem('paca.settings.volume.v1'); const value = stored === null ? 1 : Number(stored); return Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 1 } catch { return 1 } })
  const [communicationPreferences, setCommunicationPreferences] = useState<CommunicationPreferences>(readCommunicationPreferences)
  const [accessibilityPreferences, setAccessibilityPreferences] = useState<AccessibilityPreferences>(readAccessibilityPreferences)
  const [audioElementIds, setAudioElementIds] = useState<Set<string>>(() => new Set())
  const [isPlaying, setIsPlaying] = useState(false)
  const playbackRef = useRef<PlaybackSession | null>(null)
  const showNotice = useCallback((message: string) => setNotice(message), [])

  useEffect(() => {
    try { localStorage.setItem('paca.communication.elements.v1', JSON.stringify(elements)) }
    catch { setNotice('O armazenamento local está cheio. Remova uma foto ou use uma imagem menor.') }
  }, [elements])

  useEffect(() => { try { localStorage.setItem('paca.settings.speech-rate.v1', String(speechRate)) } catch { setNotice('Não foi possível salvar a velocidade da voz.') } }, [speechRate])
  useEffect(() => { try { localStorage.setItem('paca.settings.volume.v1', String(volume)) } catch { setNotice('Não foi possível salvar o volume.') } }, [volume])
  useEffect(() => { try { localStorage.setItem(communicationPreferencesKey, JSON.stringify(communicationPreferences)) } catch { setNotice('Não foi possível salvar as preferências de comunicação.') } }, [communicationPreferences])
  useEffect(() => { try { localStorage.setItem(accessibilityPreferencesKey, JSON.stringify(accessibilityPreferences)) } catch { setNotice('Não foi possível salvar as preferências de acessibilidade.') } }, [accessibilityPreferences])
  useEffect(() => {
    document.documentElement.dataset.theme = accessibilityPreferences.theme
    document.documentElement.dataset.contrast = accessibilityPreferences.highContrast ? 'high' : 'normal'
    document.documentElement.dataset.motion = accessibilityPreferences.reducedMotion ? 'reduced' : 'normal'
    document.documentElement.dataset.stimulus = accessibilityPreferences.lowStimulus ? 'reduced' : 'normal'
    document.documentElement.dataset.textSize = accessibilityPreferences.textSize
    document.documentElement.dataset.spacing = accessibilityPreferences.spacing
  }, [accessibilityPreferences])

  const refreshAudioIds = useCallback(async () => {
    try { setAudioElementIds(new Set(await listElementAudioIds())) }
    catch { setAudioElementIds(new Set()) }
  }, [])

  useEffect(() => { void refreshAudioIds() }, [refreshAudioIds])

  const message = useMemo(() => messageIds.map((id) => elements.find((element) => element.id === id)).filter((item): item is CommunicationElement => Boolean(item)), [elements, messageIds])
  const orderedElements = [...elements].sort((left, right) => communicationPreferences.categoryOrder.indexOf(left.category) - communicationPreferences.categoryOrder.indexOf(right.category))
  const communicationGroups = getCommunicationGroups(orderedElements, category, communicationPreferences.showFavorites, section === 'favorites')
  const favoriteElements = communicationGroups.favorites
  const visibleElements = communicationGroups.elements
  const editorElements = elements.filter((element) => editorCategory === 'Todas' || element.category === editorCategory)

  const stopPlayback = useCallback(() => {
    const session = playbackRef.current
    if (session) {
      session.cancelled = true
      session.audio?.pause()
      session.finishCurrent?.()
      if (session.objectUrl) URL.revokeObjectURL(session.objectUrl)
    }
    window.speechSynthesis?.cancel()
    playbackRef.current = null
    setIsPlaying(false)
  }, [])

  useEffect(() => { stopPlayback() }, [section, screen, stopPlayback])

  const newPlaybackSession = useCallback(() => {
    stopPlayback()
    const session: PlaybackSession = { cancelled: false }
    playbackRef.current = session
    setIsPlaying(true)
    return session
  }, [stopPlayback])

  const playStoredBlob = (blob: Blob, session: PlaybackSession) => new Promise<void>((resolve, reject) => {
    if (session.cancelled) { resolve(); return }
    const objectUrl = URL.createObjectURL(blob)
    const audio = new Audio(objectUrl)
    audio.volume = volume
    session.audio = audio
    session.objectUrl = objectUrl
    let finished = false
    const finish = (error?: Error) => {
      if (finished) return
      finished = true
      audio.onended = null
      audio.onerror = null
      audio.pause()
      URL.revokeObjectURL(objectUrl)
      if (session.objectUrl === objectUrl) session.objectUrl = undefined
      if (session.audio === audio) session.audio = undefined
      session.finishCurrent = undefined
      if (error) reject(error)
      else resolve()
    }
    session.finishCurrent = () => finish()
    audio.onended = () => finish()
    audio.onerror = () => finish(new Error('O navegador não conseguiu reproduzir este arquivo de áudio.'))
    void audio.play().catch((error: unknown) => finish(error instanceof Error ? error : new Error('Falha na reprodução do áudio.')))
  })

  const playSpeechText = (text: string, session: PlaybackSession) => new Promise<void>((resolve) => {
    if (session.cancelled) { resolve(); return }
    if (!('speechSynthesis' in window)) { setNotice('Este navegador não oferece reprodução por voz.'); resolve(); return }
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'pt-BR'
    utterance.rate = speechRate
    utterance.volume = volume
    session.utterance = utterance
    let finished = false
    const finish = () => {
      if (finished) return
      finished = true
      utterance.onend = null
      utterance.onerror = null
      session.utterance = undefined
      session.finishCurrent = undefined
      resolve()
    }
    session.finishCurrent = finish
    utterance.onend = finish
    utterance.onerror = finish
    window.speechSynthesis.speak(utterance)
  })

  const playElement = async (element: CommunicationElement, session: PlaybackSession) => {
    const stored = await getElementAudio(element.id).catch(() => null)
    if (session.cancelled) return
    await playWithAudioFallback(
      element,
      Boolean(stored),
      async () => { if (stored) await playStoredBlob(stored.blob, session) },
      async (item) => { await playSpeechText(item.speechText, session) },
    )
  }

  const playSelectedElement = (element: CommunicationElement) => {
    const session = newPlaybackSession()
    void playElement(element, session).catch(() => setNotice('Não foi possível reproduzir o áudio deste elemento.'))
      .finally(() => { if (playbackRef.current === session) { playbackRef.current = null; setIsPlaying(false) } })
  }

  const selectElement = (element: CommunicationElement) => {
    setMessageIds((current) => [...current, element.id])
    if (audioModeBehavior(audioMode).playOnSelect) playSelectedElement(element)
  }

  const playMessage = async () => {
    if (!message.length || !audioModeBehavior(audioMode).playMessage) return
    const session = newPlaybackSession()
    try {
      await playSequentially(message, (element) => playElement(element, session), () => session.cancelled)
    } catch {
      if (!session.cancelled) setNotice('Não foi possível concluir a reprodução da mensagem.')
    } finally {
      if (playbackRef.current === session) { playbackRef.current = null; setIsPlaying(false) }
    }
  }

  const changeAudioMode = (mode: AudioMode) => {
    stopPlayback()
    if (!writeAudioMode(mode)) setNotice('Não foi possível salvar a preferência de áudio neste navegador.')
    setAudioMode(mode)
  }

  const clearMessage = () => { stopPlayback(); setMessageIds([]) }

  const saveDraft = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!draft) return
    const clean = { ...draft, name: draft.name.trim(), speechText: draft.speechText.trim() }
    setElements((current) => current.some((element) => element.id === clean.id)
      ? current.map((element) => element.id === clean.id ? { ...clean, essential: element.essential } : element)
      : [...current, clean])
    setDraft(null)
    setNotice('Elemento salvo neste dispositivo.')
  }

  const deleteElement = (element: CommunicationElement) => {
    if (element.essential) return
    if (!window.confirm(`Excluir “${element.name}”? Esta ação não pode ser desfeita.`)) return
    stopPlayback()
    void deleteElementAudio(element.id).then(refreshAudioIds).catch(() => setNotice('O elemento foi removido, mas não foi possível limpar seu áudio local.'))
    setElements((current) => current.filter((item) => item.id !== element.id))
    setMessageIds((current) => current.filter((id) => id !== element.id))
    setDraft(null)
    setNotice('Elemento excluído.')
  }

  const uploadPhoto = async (file?: File) => {
    if (!file || !draft) return
    if (!file.type.startsWith('image/')) { setNotice('Escolha um arquivo de imagem.'); return }
    if (file.size > 12 * 1024 * 1024) { setNotice('A imagem deve ter até 12 MB antes de ser preparada.'); return }
    try {
      const image = await resizeImage(file)
      setDraft((current) => current ? { ...current, image, visualType: 'photo' } : current)
      setNotice('Imagem adicionada ao elemento.')
    } catch { setNotice('Não foi possível carregar essa imagem.') }
  }

  if (screen === 'welcome') return <main className="welcome-screen">
    <div className="welcome-nav"><a className="brand" href="#inicio" onClick={(event) => event.preventDefault()}><span className="brand-mark"><Icon name="spark" size={21} /></span><span>PACA<small>COMUNICAÇÃO ACESSÍVEL</small></span></a><button className="nav-login" onClick={() => { setAccessMode('login'); setScreen('access') }}>Já tenho uma conta <Icon name="arrow" size={16} /></button></div>
    <section className="welcome-content" id="inicio"><div className="welcome-copy"><span className="eyebrow"><span className="eyebrow-dot" /> UM JEITO NOVO DE SE EXPRESSAR</span><h1>Sua voz.<br /><span>Do seu jeito.</span></h1><p className="welcome-description">Comunicação é para todo mundo. A PACA ajuda você a transformar imagens e palavras em mensagens, no seu tempo e do seu jeito.</p><div className="welcome-actions"><button className="button-primary button-large" onClick={() => { setAccessMode('signup'); setScreen('access') }}>Começar agora <Icon name="arrow" size={18} /></button><button className="button-text" onClick={() => setScreen('app')}>Conhecer a PACA <span>↓</span></button></div><div className="welcome-proof"><span className="proof-icon"><Icon name="heart" size={17} /></span><span>Feita com cuidado, para todos os jeitos de comunicar.</span></div></div>
      <div className="welcome-art" aria-label="Exemplo de mensagem montada com elementos visuais"><div className="art-orbit orbit-one" /><div className="art-orbit orbit-two" /><div className="art-spark spark-one">✳</div><div className="art-spark spark-two">✦</div><div className="art-card card-back"><span>Olá, como você está?</span><span className="card-face">😊</span></div><div className="art-card card-main"><div className="art-card-heading"><span className="live-dot" /> SUA MENSAGEM</div><div className="art-tiles"><div className="art-tile lilac">🙋<small>Eu</small></div><div className="art-tile peach">💭<small>quero</small></div><div className="art-tile blue">💧<small>água</small></div></div><div className="art-play"><span><Icon name="volume" size={18} /></span><div><b>Ouvir mensagem</b><small>Toque para reproduzir</small></div><span className="play-arrow">▶</span></div></div><div className="floating-note"><span>💛</span> Cada pessoa tem sua voz</div></div>
    </section><footer className="welcome-footer"><span>PACA — Plataforma de Apoio à Comunicação Acessível</span><span>Comunicação é um direito. 💜</span></footer>
  </main>

  if (screen === 'access') return <main className="access-screen"><div className="access-top"><button className="back-link" onClick={() => setScreen('welcome')}>← <span>Voltar</span></button><a className="brand" href="#inicio" onClick={(event) => event.preventDefault()}><span className="brand-mark"><Icon name="spark" size={21} /></span><span>PACA<small>COMUNICAÇÃO ACESSÍVEL</small></span></a><span className="access-prototype">MODO DEMONSTRAÇÃO</span></div><section className="access-card"><div className="access-icon"><Icon name="spark" size={24} /></div><h1>{accessMode === 'signup' ? 'Vamos começar?' : 'Que bom ter você de volta!'}</h1><p>{accessMode === 'signup' ? 'Crie seu acesso para explorar a PACA.' : 'Entre para continuar sua jornada.'}</p><div className="access-tabs" role="tablist"><button className={accessMode === 'signup' ? 'active' : ''} onClick={() => setAccessMode('signup')} role="tab" aria-selected={accessMode === 'signup'}>Criar conta</button><button className={accessMode === 'login' ? 'active' : ''} onClick={() => setAccessMode('login')} role="tab" aria-selected={accessMode === 'login'}>Entrar</button></div><form onSubmit={(event) => { event.preventDefault(); setScreen('app') }}>{accessMode === 'signup' && <label>Como podemos chamar você?<input required autoComplete="name" placeholder="Seu nome" /></label>}<label>Seu e-mail<input required type="email" autoComplete="email" placeholder="voce@exemplo.com" /></label><label>Sua senha<input required type="password" autoComplete={accessMode === 'signup' ? 'new-password' : 'current-password'} placeholder="Pelo menos 8 caracteres" minLength={8} /></label><button className="button-primary access-submit" type="submit">{accessMode === 'signup' ? 'Criar minha conta' : 'Entrar'} <Icon name="arrow" size={18} /></button></form><div className="prototype-note"><span>ⓘ</span><p><b>Protótipo demonstrativo</b><br />O acesso ainda não é salvo. Qualquer informação digitada fica apenas nesta demonstração.</p></div></section><p className="access-bottom">Uma experiência pensada para acolher todos os jeitos de comunicar.</p></main>

  return <main className="app-shell"><aside id="primary-navigation" className={'sidebar ' + (mobileMenuOpen ? 'mobile-open' : '')}><a className="brand sidebar-brand" href="#inicio" onClick={(event) => event.preventDefault()}><span className="brand-mark"><Icon name="spark" size={21} /></span><span>PACA<small>COMUNICAÇÃO ACESSÍVEL</small></span></a><div className="sidebar-label">MENU</div><nav className="side-nav" aria-label="Navegação principal"><button className={section === 'communication' ? 'selected' : ''} onClick={() => { setSection('communication'); setDraft(null); setMobileMenuOpen(false) }}><Icon name="home" />Comunicação</button><button className={section === 'favorites' ? 'selected' : ''} onClick={() => { setSection('favorites'); setCategory('Todas'); setDraft(null); setMobileMenuOpen(false) }}><Icon name="heart" />Favoritas</button><button className={section === 'editing' ? 'selected' : ''} onClick={() => { setSection('editing'); setDraft(null); setMobileMenuOpen(false) }}><Icon name="edit" />Edição</button><button className={section === 'profile' ? 'selected' : ''} onClick={() => { setSection('profile'); setDraft(null); setMobileMenuOpen(false) }}><Icon name="user" />Perfil</button><button className={section === 'settings' ? 'selected' : ''} onClick={() => { setSection('settings'); setDraft(null); setMobileMenuOpen(false) }}><Icon name="settings" />Configurações</button></nav><div className="sidebar-bottom"><button className="profile-button" onClick={() => { setSection('profile'); setMobileMenuOpen(false) }}><span className="avatar">P</span><span><b>Meu espaço</b><small>Protótipo PACA</small></span><span className="profile-dots">···</span></button></div></aside>{mobileMenuOpen && <button className="mobile-nav-backdrop" aria-label="Fechar menu" onClick={() => setMobileMenuOpen(false)} />}
    <section className="workspace"><header className="topbar"><button className="mobile-menu-toggle" aria-label="Abrir menu" aria-controls="primary-navigation" aria-expanded={mobileMenuOpen} onClick={() => setMobileMenuOpen((open) => !open)}><Icon name="menu" size={21} /></button><div className="breadcrumb">PACA <span>/</span> <b>{section === 'communication' ? 'Comunicação' : section === 'favorites' ? 'Favoritas' : section === 'editing' ? 'Edição' : section === 'profile' ? 'Perfil' : 'Configurações'}</b></div>{section !== 'communication' && section !== 'favorites' && <span className="prototype-pill"><i /> PROTÓTIPO</span>}<button className="mobile-profile" aria-label="Abrir perfil" onClick={() => { setSection('profile'); setMobileMenuOpen(false) }}><Icon name="user" /></button></header>
      {section === 'editing' ? <div className="work-content editor-content"><div className="greeting-row"><div><div className="date-label">PERSONALIZE SEU VOCABULÁRIO</div><h1>Edição de elementos</h1><p>Escolha como cada palavra aparece e como será pronunciada.</p></div><div className="greeting-illustration" aria-hidden="true">✏️</div></div><div className="editor-layout"><section className="editor-library"><div className="editor-library-heading"><div><h2>Elementos de comunicação</h2><p>{elements.length} itens no seu vocabulário</p></div><button className="button-primary editor-add" onClick={() => setDraft(makeDraft())}><Icon name="plus" size={17} /> Novo elemento</button></div><div className="editor-category-filter"><button className={editorCategory === 'Todas' ? 'active' : ''} onClick={() => setEditorCategory('Todas')}>Todas</button>{communicationCategories.map((item) => <button key={item} className={editorCategory === item ? 'active' : ''} onClick={() => setEditorCategory(item)}>{item}</button>)}</div><div className="editor-element-list">{editorElements.map((element) => <button key={element.id} className={`editor-element-row ${draft?.id === element.id ? 'active' : ''}`} onClick={() => setDraft(makeDraft(element))}><Visual element={element} /><span className="editor-row-text"><b>{element.name}</b><small>{element.category} · {element.speechText}</small></span>{element.essential && <span className="essential-tag">ESSENCIAL</span>}<Icon name="arrow" size={16} /></button>)}</div></section>
        <section className="editor-form-panel">{draft ? <><div className="editor-form-heading"><div><span className="message-heading-icon"><Icon name="edit" size={17} /></span><div><h2>{elements.some((item) => item.id === draft.id) ? 'Editar elemento' : 'Novo elemento'}</h2><p>As alterações ficam salvas neste dispositivo.</p></div></div><button className="editor-close" onClick={() => setDraft(null)} aria-label="Fechar edição">×</button></div><form className="element-form" onSubmit={saveDraft}><label>Nome do elemento<input required maxLength={40} value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} placeholder="Ex.: Água" /></label><label>Categoria<select value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value as CommunicationCategory })}>{communicationCategories.map((item) => <option key={item}>{item}</option>)}</select></label><label>Palavra ou frase falada<input required maxLength={100} value={draft.speechText} onChange={(event) => setDraft({ ...draft, speechText: event.target.value })} placeholder="O que a voz vai dizer" /><small>Esse texto será usado ao reproduzir a mensagem.</small></label><fieldset><legend>Representação visual</legend><div className="representation-tabs">{(['pictogram', 'emoji', 'photo'] as VisualType[]).map((type) => <button type="button" key={type} className={draft.visualType === type ? 'active' : ''} onClick={() => setDraft({ ...draft, visualType: type })}>{type === 'pictogram' ? 'Pictograma' : type === 'emoji' ? 'Emoji' : 'Fotografia'}</button>)}</div>{draft.visualType === 'pictogram' && <div className="visual-picker">{pictograms.map(([id, label]) => <button type="button" key={id} className={draft.pictogram === id ? 'active' : ''} onClick={() => setDraft({ ...draft, pictogram: id })} aria-label={`Usar pictograma ${label}`} title={label}><svg><use href={pictogramUrl(id)} /></svg><small>{label}</small></button>)}</div>}{draft.visualType === 'emoji' && <div className="emoji-picker">{emojiChoices.map((emoji) => <button type="button" key={emoji} className={draft.emoji === emoji ? 'active' : ''} onClick={() => setDraft({ ...draft, emoji })} aria-label={`Usar emoji ${emoji}`}>{emoji}</button>)}</div>}{draft.visualType === 'photo' && <div className="photo-picker"><div className="photo-preview">{draft.image ? <img src={draft.image} alt="Prévia da imagem escolhida" /> : <Icon name="image" size={25} />}</div><label className="upload-button"><Icon name="image" size={16} /> Escolher imagem do dispositivo<input type="file" accept="image/*" onChange={(event) => void uploadPhoto(event.target.files?.[0])} /></label><small>A imagem é redimensionada e armazenada apenas neste navegador.</small></div>}</fieldset><div className="editor-form-actions">{elements.some((item) => item.id === draft.id) && !draft.essential && <button type="button" className="delete-element" onClick={() => deleteElement(draft)}><Icon name="trash" size={16} /> Excluir</button>}{draft.essential && <span className="protected-note">🔒 Elemento essencial protegido</span>}<button type="submit" className="button-primary save-element">Salvar elemento</button></div></form><AudioEditor elementId={draft.id} hasAudio={audioElementIds.has(draft.id)} saved={elements.some((element) => element.id === draft.id)} onChanged={refreshAudioIds} onNotice={showNotice} /></> : <div className="editor-empty"><span><Icon name="edit" size={23} /></span><b>Escolha um elemento para editar</b><p>Ou crie um novo elemento para personalizar seu vocabulário.</p><button className="button-primary" onClick={() => setDraft(makeDraft())}><Icon name="plus" size={17} /> Criar elemento</button></div>}</section></div><footer className="workspace-footer"><span>PACA <i>·</i> Seu vocabulário, do seu jeito.</span><span>Alterações salvas neste dispositivo.</span></footer></div> : section === 'profile' || section === 'settings' ? <AccountSections section={section} audioMode={audioMode} onAudioModeChange={changeAudioMode} speechRate={speechRate} onSpeechRateChange={setSpeechRate} volume={volume} onVolumeChange={setVolume} communication={communicationPreferences} onCommunicationChange={setCommunicationPreferences} accessibility={accessibilityPreferences} onAccessibilityChange={setAccessibilityPreferences} onDeleteImages={async () => { setElements((current) => current.map((item) => item.image ? { ...item, image: undefined, visualType: 'pictogram' } : item)); const profile = JSON.parse(localStorage.getItem('paca.profile.local.v1') || '{}'); delete profile.photo; localStorage.setItem('paca.profile.local.v1', JSON.stringify(profile)); }} onDeleteAudio={async () => { await deleteAllElementAudio(); await refreshAudioIds(); }} onDeleteCustomElements={async () => { const custom = elements.filter((item) => !item.essential); await Promise.all(custom.map((item) => deleteElementAudio(item.id))); setElements((current) => current.filter((item) => item.essential)); setMessageIds([]); await refreshAudioIds(); }} /> : <CommunicationScreen section={section as 'communication' | 'favorites'} category={category} onCategoryChange={setCategory} elements={visibleElements} favoriteElements={favoriteElements} preferences={communicationPreferences} message={message} audioMode={audioMode} isPlaying={isPlaying} onSelect={selectElement} onToggleFavorite={(id) => setElements((current) => current.map((item) => item.id === id ? { ...item, favorite: !item.favorite } : item))} onRemoveMessageItem={(index) => setMessageIds((current) => current.filter((_, itemIndex) => itemIndex !== index))} onClear={clearMessage} onListen={() => void playMessage()} onStop={stopPlayback} />}</section>{notice && <div className="toast" role="status">{notice}<button aria-label="Fechar aviso" onClick={() => setNotice('')}>×</button></div>}</main>
}

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>)
