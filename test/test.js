import { solo } from '../src/client/solo.js'
import { suite, test } from 'node:test'
import assert from 'node:assert'

suite('solo plugin', () => {
  suite('expand', () => {
    test('can escape html markup characters', () => {
      const result = solo.expand('try < & >')
      assert.equal(result, 'try &lt; &amp; &gt;')
    })
  })
})
