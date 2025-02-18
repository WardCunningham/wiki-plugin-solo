// build time tests for solo plugin
// see http://mochajs.org/

(function() {
  const solo = require('../client/solo'),
        expect = require('expect.js')
  const {describe,it} = require('node:test')

  describe('solo plugin', () => {
    describe('expand', () => {
      it('can make itallic', () => {
        var result = solo.expand('hello *world*')
        return expect(result).to.be('hello <i>world</i>')
      })
    })
  })

}).call(this)
