var expect = require('chai').expect;
var isEqual = require('../src/code.js');

describe('isEqualSpec', function() {

    describe("Array tests", function() {
        it('Two empty arrays are equal', function() {
            expect(isEqual.isEqual("root", [], [])).to.be.true;
        });

        it('Two null arrays are equal', function() {
            expect(isEqual.isEqual("root", null, null)).to.be.true;
        });

        it('Two undefined arrays are equal', function() {
            expect(isEqual.isEqual("root", undefined, undefined)).to.be.true;
        });

        it('Two arrays are equal by value and length', function() {
            expect(isEqual.isEqual("root", [1], [1])).to.be.true;
        });

        it('Two arrays with equal length with different values are not equal', function() {
            expect(isEqual.isEqual("root", [1], [2])).to.be.false;
        });
    })

});
