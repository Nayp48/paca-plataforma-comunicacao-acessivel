export const audioModeStorageKey = 'paca.settings.audio-mode.v1'

export const audioModeOptions = [
  { id: 'silent', title: 'Silencioso', description: 'Sem reprodução automática ou da mensagem.' },
  { id: 'select', title: 'Som ao selecionar', description: 'Reproduz cada elemento ao tocar nele.' },
  { id: 'message', title: 'Som ao reproduzir mensagem', description: 'Reproduz os elementos ao tocar em “Ouvir mensagem”.' },
  { id: 'both', title: 'Ambos', description: 'Reproduz ao selecionar e ao ouvir a mensagem.' },
]

export function readAudioMode(storage = globalThis.localStorage) {
  try {
    const stored = storage.getItem(audioModeStorageKey)
    return stored === 'silent' || stored === 'select' || stored === 'message' || stored === 'both' ? stored : 'message'
  } catch {
    return 'message'
  }
}

export function writeAudioMode(mode, storage = globalThis.localStorage) {
  try {
    storage.setItem(audioModeStorageKey, mode)
    return true
  } catch {
    return false
  }
}

export function audioModeBehavior(mode) {
  return {
    playOnSelect: mode === 'select' || mode === 'both',
    playMessage: mode === 'message' || mode === 'both',
    silent: mode === 'silent',
  }
}

export async function playWithAudioFallback(item, hasCustomAudio, playCustom, playSpeech) {
  if (hasCustomAudio) await playCustom(item)
  else await playSpeech(item)
}

export async function playSequentially(items, playItem, isCancelled) {
  for (const item of items) {
    if (isCancelled()) return
    await playItem(item)
  }
}
