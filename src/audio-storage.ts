const databaseName = 'paca-local-media'
const storeName = 'element-audio'
const databaseVersion = 1

export type StoredElementAudio = {
  elementId: string
  blob: Blob
  mimeType: string
  fileName: string
  updatedAt: number
}

let databasePromise: Promise<IDBDatabase> | undefined

function openDatabase(): Promise<IDBDatabase> {
  if (!('indexedDB' in window)) return Promise.reject(new Error('Este navegador não oferece armazenamento local de áudio.'))
  if (databasePromise) return databasePromise

  databasePromise = new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(databaseName, databaseVersion)
    request.onupgradeneeded = () => {
      const database = request.result
      if (!database.objectStoreNames.contains(storeName)) database.createObjectStore(storeName, { keyPath: 'elementId' })
    }
    request.onsuccess = () => {
      const database = request.result
      database.onversionchange = () => database.close()
      resolve(database)
    }
    request.onerror = () => reject(request.error ?? new Error('Não foi possível abrir o armazenamento de áudio.'))
    request.onblocked = () => reject(new Error('Feche outras abas da PACA e tente novamente.'))
  }).catch((error: unknown) => {
    databasePromise = undefined
    throw error
  })
  return databasePromise!
}

export async function getElementAudio(elementId: string): Promise<StoredElementAudio | null> {
  const database = await openDatabase()
  return new Promise((resolve, reject) => {
    const request = database.transaction(storeName, 'readonly').objectStore(storeName).get(elementId)
    request.onsuccess = () => resolve((request.result as StoredElementAudio | undefined) ?? null)
    request.onerror = () => reject(request.error ?? new Error('Não foi possível ler o áudio.'))
  })
}

export async function saveElementAudio(audio: StoredElementAudio): Promise<void> {
  const database = await openDatabase()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, 'readwrite')
    transaction.objectStore(storeName).put(audio)
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error ?? new Error('Não foi possível salvar o áudio.'))
    transaction.onabort = () => reject(transaction.error ?? new Error('O armazenamento de áudio está sem espaço.'))
  })
}

export async function deleteElementAudio(elementId: string): Promise<void> {
  const database = await openDatabase()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, 'readwrite')
    transaction.objectStore(storeName).delete(elementId)
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error ?? new Error('Não foi possível remover o áudio.'))
    transaction.onabort = () => reject(transaction.error ?? new Error('Não foi possível remover o áudio.'))
  })
}

export async function listElementAudioIds(): Promise<string[]> {
  const database = await openDatabase()
  return new Promise((resolve, reject) => {
    const request = database.transaction(storeName, 'readonly').objectStore(storeName).getAllKeys()
    request.onsuccess = () => resolve(request.result.filter((key): key is string => typeof key === 'string'))
    request.onerror = () => reject(request.error ?? new Error('Não foi possível listar os áudios.'))
  })
}

export async function deleteAllElementAudio(): Promise<void> {
  const database = await openDatabase()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, 'readwrite')
    transaction.objectStore(storeName).clear()
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error ?? new Error('Não foi possível remover os áudios.'))
    transaction.onabort = () => reject(transaction.error ?? new Error('Não foi possível remover os áudios.'))
  })
}
