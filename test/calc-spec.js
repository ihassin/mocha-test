var expect = require('chai').expect;
var add = require('../src/code.js').add
  , sub = require('../src/code.js').sub;

describe('calcSpec', function() {
    it('should add', function() {
        expect(add(2,2)).to.equal(4);
    });

    it('should sub', function() {
        expect(sub(2,2)).to.equal(0);
    });
});
