import assert from 'node:assert/strict'
import test from 'node:test'
import { getCommunicationGroups } from './communication-view.mjs'

const fixture = [
  { id: 'water', category: 'Necessidades', favorite: true },
  { id: 'happy', category: 'Sentimentos', favorite: false },
  { id: 'help', category: 'Necessidades', favorite: false },
]

test('favorites appear at top and are not duplicated in the category grid', () => {
  const groups = getCommunicationGroups(fixture, 'Todas', true)
  assert.deepEqual(groups.favorites.map(({ id }) => id), ['water'])
  assert.deepEqual(groups.elements.map(({ id }) => id), ['happy', 'help'])
})

test('removing and adding a favorite is reflected in both groups', () => {
  const removed = getCommunicationGroups(fixture.map((item) => item.id === 'water' ? { ...item, favorite: false } : item), 'Todas', true)
  assert.equal(removed.favorites.length, 0)
  assert.ok(removed.elements.some(({ id }) => id === 'water'))
  const added = getCommunicationGroups(fixture.map((item) => item.id === 'happy' ? { ...item, favorite: true } : item), 'Todas', true)
  assert.ok(added.favorites.some(({ id }) => id === 'happy'))
  assert.ok(!added.elements.some(({ id }) => id === 'happy'))
})

test('favorites are hidden from the top and remain in the normal grid when disabled', () => {
  const groups = getCommunicationGroups(fixture, 'Todas', false)
  assert.equal(groups.favorites.length, 0)
  assert.deepEqual(groups.elements.map(({ id }) => id), ['water', 'happy', 'help'])
})

test('the favorites page remains filtered and category filtering applies to regular items', () => {
  const favoritePage = getCommunicationGroups(fixture, 'Todas', true, true)
  assert.deepEqual(favoritePage.elements.map(({ id }) => id), ['water'])
  const category = getCommunicationGroups(fixture, 'Necessidades', true)
  assert.deepEqual(category.favorites.map(({ id }) => id), ['water'])
  assert.deepEqual(category.elements.map(({ id }) => id), ['help'])
})
