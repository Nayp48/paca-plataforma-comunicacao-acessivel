import assert from 'node:assert/strict'
import test from 'node:test'
import { audioModeBehavior, audioModeStorageKey, playSequentially, playWithAudioFallback, readAudioMode, writeAudioMode } from './audio-mode.mjs'

test('os quatro modos habilitam somente os comportamentos escolhidos', () => {
  assert.deepEqual(audioModeBehavior('silent'), { playOnSelect: false, playMessage: false, silent: true })
  assert.deepEqual(audioModeBehavior('select'), { playOnSelect: true, playMessage: false, silent: false })
  assert.deepEqual(audioModeBehavior('message'), { playOnSelect: false, playMessage: true, silent: false })
  assert.deepEqual(audioModeBehavior('both'), { playOnSelect: true, playMessage: true, silent: false })
})

test('a preferência de áudio é lida e gravada em uma chave separada', () => {
  const data = new Map()
  const storage = { getItem: (key) => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) }
  assert.equal(readAudioMode(storage), 'message')
  assert.equal(writeAudioMode('silent', storage), true)
  assert.equal(data.get(audioModeStorageKey), 'silent')
  assert.equal(readAudioMode(storage), 'silent')
  data.set(audioModeStorageKey, 'invalid')
  assert.equal(readAudioMode(storage), 'message')
})

test('usa áudio personalizado sem chamar a voz automática, ou a voz como alternativa', async () => {
  const calls = []
  const custom = async (item) => calls.push(`custom:${item}`)
  const speech = async (item) => calls.push(`speech:${item}`)
  await playWithAudioFallback('Água', true, custom, speech)
  await playWithAudioFallback('Quero', false, custom, speech)
  assert.deepEqual(calls, ['custom:Água', 'speech:Quero'])
})

test('a mensagem aguarda cada elemento antes de reproduzir o próximo', async () => {
  const events = []
  await playSequentially(['Eu', 'quero', 'água'], async (item) => {
    events.push(`início:${item}`)
    await Promise.resolve()
    events.push(`fim:${item}`)
  }, () => false)
  assert.deepEqual(events, ['início:Eu', 'fim:Eu', 'início:quero', 'fim:quero', 'início:água', 'fim:água'])
})

test('interromper a sequência impede que elementos seguintes sejam iniciados', async () => {
  const events = []
  let cancelled = false
  await playSequentially(['Eu', 'quero', 'água'], async (item) => {
    events.push(item)
    if (item === 'Eu') cancelled = true
  }, () => cancelled)
  assert.deepEqual(events, ['Eu'])
})
