import { useEffect, useState } from 'react'
import { audioModeOptions, type AudioMode } from './audio-mode.mjs'
import {
  readLocalProfile,
  type AccessibilityPreferences, type CommunicationPreferences, type LocalProfile,
} from './preferences'
import './account-sections.css'

type Props = {
  section: 'profile' | 'settings'
  audioMode: AudioMode
  onAudioModeChange: (mode: AudioMode) => void
  speechRate: number
  onSpeechRateChange: (value: number) => void
  volume: number
  onVolumeChange: (value: number) => void
  communication: CommunicationPreferences
  onCommunicationChange: (value: CommunicationPreferences) => void
  accessibility: AccessibilityPreferences
  onAccessibilityChange: (value: AccessibilityPreferences) => void
  onDeleteImages: () => Promise<void>
  onDeleteAudio: () => Promise<void>
  onDeleteCustomElements: () => Promise<void>
}

const neuroOptions = ['Autismo (TEA)', 'TDAH', 'Dislexia', 'Dispraxia', 'Altas habilidades/superdotação', 'Outra', 'Prefiro não informar']
const disabilityOptions = ['Visual', 'Auditiva', 'Física ou motora', 'Intelectual', 'Psicossocial', 'Múltipla', 'Outra', 'Prefiro não informar']
const communicationOptions = ['Prefiro pictogramas', 'Prefiro fotografias', 'Prefiro emojis', 'Prefiro textos', 'Prefiro comunicação com áudio', 'Prefiro comunicação silenciosa', 'Preciso de elementos maiores', 'Prefiro uma interface com poucos estímulos visuais', 'Outra']

function MultiSelect({ title, options, selected, onChange, otherLabel, otherValue, onOtherChange }: {
  title: string; options: string[]; selected: string[]; onChange: (values: string[]) => void
  otherLabel: string; otherValue: string; onOtherChange: (value: string) => void
}) {
  const toggle = (option: string) => {
    if (option === 'Prefiro não informar') { onChange(selected.includes(option) ? [] : [option]); return }
    const withoutDecline = selected.filter((item) => item !== 'Prefiro não informar')
    onChange(withoutDecline.includes(option) ? withoutDecline.filter((item) => item !== option) : [...withoutDecline, option])
  }
  return <fieldset className="local-fieldset"><legend>{title} <span>(opcional)</span></legend><div className="local-check-grid">{options.map((option) => <label className="local-check" key={option}><input type="checkbox" checked={selected.includes(option)} onChange={() => toggle(option)} /><span>{option}</span></label>)}</div>{selected.includes('Outra') && <label className="local-label">{otherLabel}<input value={otherValue} maxLength={100} onChange={(event) => onOtherChange(event.target.value)} /></label>}</fieldset>
}

function ProfileSection() {
  const [profile, setProfile] = useState<LocalProfile>(readLocalProfile)
  const [status, setStatus] = useState('')
  const update = <K extends keyof LocalProfile>(key: K, value: LocalProfile[K]) => setProfile((current) => ({ ...current, [key]: value }))
  const save = (event: React.FormEvent) => {
    event.preventDefault()
    try { localStorage.setItem('paca.profile.local.v1', JSON.stringify(profile)); setStatus('Perfil salvo neste dispositivo.') }
    catch { setStatus('Não foi possível salvar. O armazenamento local pode estar cheio.') }
  }
  const choosePhoto = (file?: File) => {
    if (!file) return
    if (!file.type.startsWith('image/') || file.size > 8 * 1024 * 1024) { setStatus('Escolha uma imagem de até 8 MB.'); return }
    const url = URL.createObjectURL(file); const image = new Image()
    image.onload = () => { const scale = Math.min(1, 480 / Math.max(image.width, image.height)); const canvas = document.createElement('canvas'); canvas.width = Math.max(1, Math.round(image.width * scale)); canvas.height = Math.max(1, Math.round(image.height * scale)); const context = canvas.getContext('2d'); if (context) { context.drawImage(image, 0, 0, canvas.width, canvas.height); update('photo', canvas.toDataURL('image/jpeg', .8)); setStatus('Foto preparada. Salve o perfil para manter a alteração.') }; URL.revokeObjectURL(url) }
    image.onerror = () => { URL.revokeObjectURL(url); setStatus('Não foi possível abrir essa imagem.') }; image.src = url
  }
  const clearSensitive = () => {
    if (!window.confirm('Apagar neurodivergências, deficiências e preferências de comunicação do perfil?')) return
    const cleared = { ...profile, neurodivergences: [], otherNeurodivergence: '', disabilities: [], otherDisability: '', communicationPreferences: [], otherCommunicationPreference: '' }
    setProfile(cleared)
    try { localStorage.setItem('paca.profile.local.v1', JSON.stringify(cleared)); setStatus('Informações opcionais apagadas deste dispositivo.') } catch { setStatus('Não foi possível salvar a alteração.') }
  }
  return <div className="work-content account-content local-account">
    <div className="greeting-row"><div><div className="date-label">NESTE DISPOSITIVO</div><h1>Perfil</h1><p>Personalize suas informações. Todos os campos são opcionais.</p></div></div>
    <div className="account-local-note">Ainda não existe uma conta autenticada. Seu perfil fica neste dispositivo e navegador e não é enviado para serviços externos.</div>
    <form className="account-card profile-form" onSubmit={save}>
      <h2>Informações pessoais</h2><div className="local-form-grid"><label className="local-label">Nome de exibição<input value={profile.displayName} maxLength={80} onChange={(event) => update('displayName', event.target.value)} /></label><label className="local-label">Nome pelo qual prefere ser chamado<input value={profile.preferredName} maxLength={80} onChange={(event) => update('preferredName', event.target.value)} /></label><label className="local-label local-span-two">Breve descrição<textarea value={profile.description} maxLength={300} rows={3} onChange={(event) => update('description', event.target.value)} /></label></div>
      <div className="profile-photo-row"><div className="profile-photo-preview">{profile.photo ? <img src={profile.photo} alt="Foto de perfil" /> : <span aria-hidden="true">＋</span>}</div><label className="local-button">Escolher foto<input type="file" accept="image/*" onChange={(event) => choosePhoto(event.target.files?.[0])} /></label>{profile.photo && <button className="local-button subtle" type="button" onClick={() => update('photo', '')}>Remover foto</button>}<small>Redimensionada e guardada localmente.</small></div>
      <div className="profile-sensitive"><h2>Informações opcionais sobre você</h2><p>Nenhuma informação de saúde é necessária para usar a PACA. Você pode deixar em branco, editar ou apagar quando quiser.</p>
        <MultiSelect title="Neurodivergências" options={neuroOptions} selected={profile.neurodivergences} onChange={(value) => update('neurodivergences', value)} otherLabel="Especifique outra neurodivergência" otherValue={profile.otherNeurodivergence} onOtherChange={(value) => update('otherNeurodivergence', value)} />
        <MultiSelect title="Deficiências" options={disabilityOptions} selected={profile.disabilities} onChange={(value) => update('disabilities', value)} otherLabel="Especifique outra deficiência" otherValue={profile.otherDisability} onOtherChange={(value) => update('otherDisability', value)} />
        <MultiSelect title="Preferências e necessidades de comunicação" options={communicationOptions} selected={profile.communicationPreferences} onChange={(value) => update('communicationPreferences', value)} otherLabel="Especifique outra preferência" otherValue={profile.otherCommunicationPreference} onOtherChange={(value) => update('otherCommunicationPreference', value)} />
        <button type="button" className="local-button subtle" onClick={clearSensitive}>Apagar informações opcionais</button>
      </div>
      <div className="local-form-actions"><span role="status">{status}</span><button className="button-primary" type="submit">Salvar perfil</button></div>
    </form>
  </div>
}

function SettingsSection(props: Props) {
  const [previewing, setPreviewing] = useState(false)
  const [audioStatus, setAudioStatus] = useState('')
  useEffect(() => () => { window.speechSynthesis?.cancel() }, [])
  const updateCommunication = <K extends keyof CommunicationPreferences>(key: K, value: CommunicationPreferences[K]) => props.onCommunicationChange({ ...props.communication, [key]: value })
  const updateAccessibility = <K extends keyof AccessibilityPreferences>(key: K, value: AccessibilityPreferences[K]) => props.onAccessibilityChange({ ...props.accessibility, [key]: value })
  const moveCategory = (index: number, direction: -1 | 1) => {
    const order = [...props.communication.categoryOrder]; const target = index + direction
    if (target < 0 || target >= order.length) return
    ;[order[index], order[target]] = [order[target], order[index]]; updateCommunication('categoryOrder', order)
  }
  const stopPreview = () => { window.speechSynthesis?.cancel(); setPreviewing(false) }
  useEffect(() => { if (props.audioMode === 'silent') stopPreview() }, [props.audioMode])
  const preview = () => {
    if (props.audioMode === 'silent') return
    if (!('speechSynthesis' in window)) { setAudioStatus('Este navegador não oferece prévia por voz.'); return }
    setAudioStatus(''); stopPreview(); const utterance = new SpeechSynthesisUtterance('Esta é uma prévia da voz e da velocidade selecionadas.'); utterance.lang = 'pt-BR'; utterance.rate = props.speechRate; utterance.volume = props.volume; utterance.onend = () => setPreviewing(false); utterance.onerror = () => { setPreviewing(false); setAudioStatus('Não foi possível reproduzir a prévia neste dispositivo.') }; setPreviewing(true); window.speechSynthesis.speak(utterance)
  }
  const clearData = async (kind: 'images' | 'audio' | 'elements') => {
    const labels = { images: 'imagens personalizadas', audio: 'áudios personalizados', elements: 'elementos criados por você e seus áudios associados' }
    if (!window.confirm(`Apagar ${labels[kind]} deste dispositivo? Esta ação não pode ser desfeita.`)) return
    try {
      if (kind === 'images') await props.onDeleteImages()
      if (kind === 'audio') await props.onDeleteAudio()
      if (kind === 'elements') await props.onDeleteCustomElements()
      window.alert(`${labels[kind][0].toUpperCase()}${labels[kind].slice(1)} apagados deste dispositivo.`)
    } catch { window.alert('Não foi possível concluir a exclusão. Tente novamente.') }
  }
  return <div className="work-content account-content local-account">
    <div className="greeting-row"><div><div className="date-label">PREFERÊNCIAS NESTE DISPOSITIVO</div><h1>Configurações</h1><p>As alterações são salvas automaticamente.</p></div></div>
    <section className="account-card audio-settings"><fieldset><legend>Áudio e voz</legend><p>Modo selecionado: <b>{audioModeOptions.find((item) => item.id === props.audioMode)?.title}</b></p><div className="audio-mode-options">{audioModeOptions.map((option) => <label key={option.id} className={`audio-mode-option ${props.audioMode === option.id ? 'selected' : ''}`}><input type="radio" name="audio-mode" value={option.id} checked={props.audioMode === option.id} onChange={() => props.onAudioModeChange(option.id)} /><span><b>{option.title}</b><small>{option.description}</small></span></label>)}</div>
      <label className="setting-range">Velocidade da voz automática <b>{props.speechRate.toFixed(2)}×</b><input type="range" min="0.6" max="1.4" step="0.05" value={props.speechRate} onChange={(event) => props.onSpeechRateChange(Number(event.target.value))} /></label>
      <label className="setting-range">Volume da reprodução <b>{Math.round(props.volume * 100)}%</b><input type="range" min="0" max="1" step="0.05" value={props.volume} onChange={(event) => props.onVolumeChange(Number(event.target.value))} /><small>O volume pode ser limitado pelo sistema ou navegador.</small></label>
      <div className="setting-actions"><button className="local-button" type="button" disabled={props.audioMode === 'silent' || previewing} onClick={preview}>Prévia da voz</button><button className="local-button" type="button" disabled={!previewing} onClick={stopPreview}>Interromper áudio</button></div>{audioStatus && <small className="audio-preview-status" role="status">{audioStatus}</small>}
    </fieldset></section>
    <section className="account-card setting-group"><h2>Comunicação</h2><p>Ajustes aplicados à grade principal.</p>
      <div className="local-form-grid"><label className="local-label">Tamanho dos pictogramas<select value={props.communication.tileSize} onChange={(event) => updateCommunication('tileSize', event.target.value as CommunicationPreferences['tileSize'])}><option value="small">Pequeno</option><option value="medium">Médio</option><option value="large">Grande</option></select></label><label className="local-label">Elementos por linha (telas grandes)<select value={props.communication.columns} onChange={(event) => updateCommunication('columns', Number(event.target.value) as CommunicationPreferences['columns'])}>{[3,4,5,6].map((n) => <option key={n} value={n}>{n} por linha</option>)}</select></label><label className="local-label">Apresentação dos elementos<select value={props.communication.presentation} onChange={(event) => updateCommunication('presentation', event.target.value as CommunicationPreferences['presentation'])}><option value="complete">Imagem e palavra</option><option value="compact">Compacta</option><option value="visual">Destaque visual</option></select></label></div>
      <label className="local-check setting-toggle"><input type="checkbox" checked={props.communication.showFavorites} onChange={(event) => updateCommunication('showFavorites', event.target.checked)} /><span>Exibir favoritos no topo da Comunicação</span></label>
      <fieldset className="local-fieldset"><legend>Ordem das categorias <span>(use as setas para organizar)</span></legend><div className="category-order-list">{props.communication.categoryOrder.map((item, index) => <div key={item}><span>{item}</span><button type="button" aria-label={`Mover ${item} para cima`} disabled={index === 0} onClick={() => moveCategory(index, -1)}>↑</button><button type="button" aria-label={`Mover ${item} para baixo`} disabled={index === props.communication.categoryOrder.length - 1} onClick={() => moveCategory(index, 1)}>↓</button></div>)}</div></fieldset>
    </section>
    <section className="account-card setting-group"><h2>Aparência e acessibilidade</h2>
      <div className="local-form-grid"><label className="local-label">Tema<select value={props.accessibility.theme} onChange={(event) => updateAccessibility('theme', event.target.value as AccessibilityPreferences['theme'])}><option value="light">Claro</option><option value="dark">Escuro</option></select></label><label className="local-label">Tamanho dos textos<select value={props.accessibility.textSize} onChange={(event) => updateAccessibility('textSize', event.target.value as AccessibilityPreferences['textSize'])}><option value="normal">Normal</option><option value="large">Grande</option><option value="xlarge">Muito grande</option></select></label><label className="local-label">Espaçamento entre elementos<select value={props.accessibility.spacing} onChange={(event) => updateAccessibility('spacing', event.target.value as AccessibilityPreferences['spacing'])}><option value="normal">Normal</option><option value="comfortable">Confortável</option><option value="wide">Amplo</option></select></label></div>
      <label className="local-check setting-toggle"><input type="checkbox" checked={props.accessibility.highContrast} onChange={(event) => updateAccessibility('highContrast', event.target.checked)} /><span>Modo de alto contraste</span></label><label className="local-check setting-toggle"><input type="checkbox" checked={props.accessibility.reducedMotion} onChange={(event) => updateAccessibility('reducedMotion', event.target.checked)} /><span>Reduzir animações e transições</span></label><label className="local-check setting-toggle"><input type="checkbox" checked={props.accessibility.lowStimulus} onChange={(event) => updateAccessibility('lowStimulus', event.target.checked)} /><span>Reduzir estímulos visuais</span></label>
    </section>
    <section className="account-card setting-group privacy-settings"><h2>Privacidade e dados</h2><p>Elementos e preferências ficam no armazenamento deste navegador. Fotos de perfil e imagens também são locais; os áudios ficam no IndexedDB deste dispositivo. Não há sincronização com conta real nem envio para serviços externos.</p><div className="privacy-actions"><div><b>Imagens personalizadas</b><button type="button" onClick={() => void clearData('images')}>Apagar imagens</button></div><div><b>Áudios personalizados</b><button type="button" onClick={() => void clearData('audio')}>Apagar áudios</button></div><div><b>Elementos criados</b><button type="button" onClick={() => void clearData('elements')}>Apagar elementos personalizados</button></div></div><small>As confirmações aparecem antes de qualquer exclusão. Os elementos essenciais do sistema são preservados.</small></section>
  </div>
}

export function AccountSections(props: Props) {
  return props.section === 'profile' ? <ProfileSection /> : <SettingsSection {...props} />
}
