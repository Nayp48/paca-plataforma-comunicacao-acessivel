import { useEffect, useRef, useState } from 'react'
import { deleteElementAudio, getElementAudio, saveElementAudio } from './audio-storage'

const maxAudioBytes = 20 * 1024 * 1024
const acceptedAudioTypes = new Set(['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'audio/wave', 'audio/ogg', 'audio/webm', 'audio/mp4', 'audio/aac', 'audio/flac'])
const acceptedAudioExtensions = /\.(mp3|wav|ogg|webm|m4a|aac|flac)$/i
const extensionMimeTypes: Record<string, string> = { mp3: 'audio/mpeg', wav: 'audio/wav', ogg: 'audio/ogg', webm: 'audio/webm', m4a: 'audio/mp4', aac: 'audio/aac', flac: 'audio/flac' }

type Props = {
  elementId: string
  hasAudio: boolean
  saved: boolean
  onChanged: () => void
  onNotice: (message: string) => void
}

export function AudioEditor({ elementId, hasAudio, saved, onChanged, onNotice }: Props) {
  const [storedAudio, setStoredAudio] = useState<Blob | null>(null)
  const [draftAudio, setDraftAudio] = useState<Blob | null>(null)
  const [draftFileName, setDraftFileName] = useState('')
  const [previewUrl, setPreviewUrl] = useState('')
  const [recording, setRecording] = useState(false)
  const [busy, setBusy] = useState(false)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const discardRecordingRef = useRef(false)

  useEffect(() => {
    let cancelled = false
    setStoredAudio(null)
    if (hasAudio) {
      void getElementAudio(elementId).then((audio) => {
        if (!cancelled) setStoredAudio(audio?.blob ?? null)
      }).catch(() => {
        if (!cancelled) onNotice('Não foi possível carregar os dados do áudio salvo.')
      })
    }
    return () => { cancelled = true }
  }, [elementId, hasAudio, onNotice])

  useEffect(() => {
    const blob = draftAudio ?? storedAudio
    if (!blob) { setPreviewUrl(''); return }
    const url = URL.createObjectURL(blob)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [draftAudio, storedAudio])

  useEffect(() => () => {
    discardRecordingRef.current = true
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop()
    streamRef.current?.getTracks().forEach((track) => track.stop())
  }, [])

  const startRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      onNotice('Este navegador não permite gravação de áudio. Tente usar HTTPS ou um navegador compatível.')
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const preferredTypes = ['audio/webm;codecs=opus', 'audio/ogg;codecs=opus', 'audio/webm', 'audio/ogg', 'audio/mp4']
      const mimeType = preferredTypes.find((type) => MediaRecorder.isTypeSupported(type))
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream)
      const chunks: BlobPart[] = []
      discardRecordingRef.current = false
      setDraftAudio(null)
      setDraftFileName('')
      recorder.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data) }
      recorder.onerror = () => {
        stream.getTracks().forEach((track) => track.stop())
        setRecording(false)
        onNotice('A gravação foi interrompida pelo navegador.')
      }
      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop())
        streamRef.current = null
        if (discardRecordingRef.current) return
        const blob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' })
        if (!blob.size) { onNotice('A gravação ficou vazia. Tente novamente.'); return }
        if (blob.size > maxAudioBytes) { onNotice('O áudio passou de 20 MB e não foi mantido. Grave um trecho menor.'); return }
        setDraftAudio(blob)
        setDraftFileName('')
      }
      recorderRef.current = recorder
      recorder.start()
      setRecording(true)
      onNotice('Gravando. Toque em “Finalizar gravação” quando terminar.')
    } catch (error) {
      streamRef.current?.getTracks().forEach((track) => track.stop())
      streamRef.current = null
      const name = error instanceof DOMException ? error.name : ''
      if (name === 'NotAllowedError' || name === 'SecurityError') onNotice('Acesso ao microfone negado. Autorize o microfone nas permissões do navegador e tente novamente.')
      else if (name === 'NotFoundError' || name === 'DevicesNotFoundError') onNotice('Nenhum microfone foi encontrado neste dispositivo.')
      else onNotice('Não foi possível iniciar a gravação. Verifique o microfone e tente novamente.')
    }
  }

  const finishRecording = () => {
    const recorder = recorderRef.current
    if (recorder?.state === 'recording') {
      recorder.stop()
      setRecording(false)
      onNotice('Gravação finalizada. Ouça a prévia antes de salvar.')
    }
  }

  const cancelAudio = () => {
    discardRecordingRef.current = true
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop()
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    setRecording(false)
    setDraftAudio(null)
    setDraftFileName('')
    onNotice('Gravação ou alteração de áudio cancelada.')
  }

  const chooseFile = (file?: File) => {
    if (!file) return
    if (!acceptedAudioTypes.has(file.type) && !acceptedAudioExtensions.test(file.name)) {
      onNotice('Escolha um arquivo MP3, WAV, OGG, WebM, M4A, AAC ou FLAC.')
      return
    }
    if (file.size > maxAudioBytes) {
      onNotice('O arquivo deve ter até 20 MB para armazenamento local.')
      return
    }
    const extension = file.name.split('.').pop()?.toLowerCase() ?? ''
    const mimeType = acceptedAudioTypes.has(file.type) ? file.type : extensionMimeTypes[extension]
    setDraftAudio(file.slice(0, file.size, mimeType || file.type))
    setDraftFileName(file.name)
    onNotice('Arquivo carregado. Ouça a prévia e salve para associá-lo ao elemento.')
  }

  const saveAudio = async () => {
    if (!draftAudio) return
    setBusy(true)
    try {
      const estimate = await navigator.storage?.estimate()
      if (estimate?.quota && estimate.usage !== undefined && estimate.quota - estimate.usage < draftAudio.size) {
        onNotice('O navegador está sem espaço disponível para salvar este áudio.')
        return
      }
      await saveElementAudio({
        elementId,
        blob: draftAudio,
        mimeType: draftAudio.type || 'application/octet-stream',
        fileName: draftFileName || `gravacao-${elementId}`,
        updatedAt: Date.now(),
      })
      setDraftAudio(null)
      setDraftFileName('')
      onChanged()
      onNotice('Áudio salvo para este elemento neste dispositivo.')
    } catch {
      onNotice('Não foi possível salvar o áudio. Verifique o espaço disponível neste navegador.')
    } finally {
      setBusy(false)
    }
  }

  const removeAudio = async () => {
    if (!window.confirm('Remover somente o áudio personalizado deste elemento?')) return
    setBusy(true)
    try {
      await deleteElementAudio(elementId)
      setStoredAudio(null)
      setDraftAudio(null)
      setDraftFileName('')
      onChanged()
      onNotice('Áudio personalizado removido. O elemento e suas imagens foram preservados.')
    } catch {
      onNotice('Não foi possível remover o áudio. Tente novamente.')
    } finally {
      setBusy(false)
    }
  }

  return <section className="audio-editor" aria-labelledby={`audio-editor-${elementId}`}>
    <div className="audio-editor-heading"><div><h3 id={`audio-editor-${elementId}`}>Áudio personalizado</h3><p>{hasAudio ? 'Este elemento tem uma gravação ou arquivo de áudio.' : 'Grave sua voz ou escolha um arquivo para este elemento.'}</p></div><span className={`audio-state ${hasAudio ? 'has-audio' : ''}`}>{hasAudio ? 'Áudio salvo' : 'Sem áudio'}</span></div>
    {!saved ? <p className="audio-editor-hint">Salve o elemento antes de associar um áudio.</p> : <>
      {previewUrl && <audio className="audio-preview" controls preload="none" src={previewUrl}>Seu navegador não oferece reprodução de áudio.</audio>}
      <div className="audio-editor-actions">{recording ? <><button type="button" className="audio-action audio-stop" onClick={finishRecording}>Finalizar gravação</button><button type="button" className="audio-action" onClick={cancelAudio}>Cancelar gravação</button></> : <button type="button" className="audio-action" onClick={() => void startRecording()} disabled={busy}>Gravar pelo microfone</button>}
        <label className="audio-action audio-file">Enviar arquivo de áudio<input type="file" accept="audio/mpeg,audio/mp3,audio/wav,audio/x-wav,audio/ogg,audio/webm,audio/mp4,audio/aac,audio/flac,.mp3,.wav,.ogg,.webm,.m4a,.aac,.flac" onChange={(event) => { chooseFile(event.target.files?.[0]); event.currentTarget.value = '' }} disabled={recording || busy} /></label>
      </div>
      {draftAudio && <div className="audio-draft-actions"><span>Prévia pronta para salvar</span><button type="button" onClick={cancelAudio} disabled={busy}>Cancelar</button><button type="button" className="button-primary" onClick={() => void saveAudio()} disabled={busy}>{busy ? 'Salvando…' : hasAudio ? 'Substituir áudio' : 'Salvar áudio'}</button></div>}
      {hasAudio && !draftAudio && <button type="button" className="audio-remove" onClick={() => void removeAudio()} disabled={busy}>Remover somente o áudio</button>}
    </>}
    <p className="audio-editor-footnote">Arquivos de até 20 MB. O áudio fica neste dispositivo, separado das imagens.</p>
  </section>
}
