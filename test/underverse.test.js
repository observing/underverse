describe('Underverse', function () {
  'use strict';

  var Underverse = require('../')
    , chai = require('chai')
    , expect = chai.expect;

  it('should be exposed as a function', function () {
    expect(Underverse).to.be.a('function');
  });

  it('should configure the size/length of the ring', function () {
    var uv = new Underverse(100);
    expect(uv.ring.length).to.equal(100);
  });

  it('is an EventEmitter', function () {
    var uv = new Underverse();

    expect(uv).to.be.instanceOf(require('events').EventEmitter);
  });

  describe('#received', function () {
    it('marks the slot as received', function () {
      var uv = new Underverse();

      uv.received(0);
      expect(uv.ring[0]).to.equal(1);
    });

    it('returns true if the id was in order', function () {
      var uv = new Underverse();

      expect(uv.received(0)).to.equal(true);
      expect(uv.received(1)).to.equal(true);
      expect(uv.received(2)).to.equal(true);
      expect(uv.received(1)).to.equal(false);
      expect(uv.received(6)).to.equal(false);
    });

    it('emits `fetch` when data is missing', function (done) {
      var uv = new Underverse();

      uv.on('fetch', function (missing, mark) {
        expect(missing).to.be.a('array');

        expect(missing).to.include(1);
        expect(missing).to.include(2);
        expect(missing).to.include(3);
        expect(missing).to.have.length(3);

        done();
      });

      uv.received(0);
      uv.received(4);
    });

    it('emits `fetch` with the missing ids not those are currently fetching', function (done) {
      var uv = new Underverse();

      uv.once('fetch', function (missing, mark) {
        expect(missing).to.be.a('array');

        expect(missing).to.include(1);
        expect(missing).to.include(2);
        expect(missing).to.include(3);
        expect(missing).to.have.length(3);

        // mark some as fetching
        uv.ring[2] = 0;
        uv.ring[3] = 0;
      });

      uv.received(0);
      uv.received(4);

      uv.once('fetch', function (missing, mark) {
        expect(missing).to.be.a('array');
        expect(missing).to.include(1);
        expect(missing).to.include(5);
        expect(missing).to.include(6);
        expect(missing).to.include(7);

        expect(missing).to.have.length(4);
        done();
      });

      uv.received(8);
    });

    it('provides the `fetch` event with a mark function', function (done) {
      var uv = new Underverse();

      uv.once('fetch', function (missing, mark) {
        expect(mark).to.be.a('function');

        missing.forEach(function (pos) {
          expect(uv.ring[pos]).to.equal(undefined);
        });

        mark();

        missing.forEach(function (pos) {
          expect(uv.ring[pos]).to.equal(0);
        });

        mark(true);

        missing.forEach(function (pos) {
          expect(uv.ring[pos]).to.equal(1);
        });

        done();
      });

      uv.received(0);
      uv.received(4);
    });

    it('only emits `fetch` when theres data missing', function () {
      var uv = new Underverse()
        , called = 0;

      uv.on('fetch', function (missing, mark) {
        mark();
        called++;
      });

      uv.received(0);
      uv.received(10);
      uv.received(10);
      uv.received(10);
      uv.received(9);
      uv.received(8);

      expect(called).to.equal(1);
    });
  });

  describe('#slice', function () {
    it('normalizes the start value', function () {
      var uv = new Underverse(10);

      expect(uv.slice(-1, 2)).to.deep.equal([0, 1]);
    });

    it('normalizes the end value', function () {
      var uv = new Underverse(10);

      expect(uv.slice(9, 100)).to.deep.equal([9, 10]);
    });

    it('returns an empty array if start and end are the same', function () {
      var uv = new Underverse();

      expect(uv.slice(10, 10)).to.be.a('array');
      expect(uv.slice(10, 10)).to.have.length(0);
    });

    it('supports ring overflow', function () {
      var uv = new Underverse(100)
        , slice = uv.slice(90, 10);

      var res = [
        90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100,
        0, 1, 2, 3, 4, 5, 6, 7, 8, 9
      ];

      expect(slice).to.have.length(res.length);

      res.forEach(function (nr) {
        expect(slice).to.include(nr);
      });
    });
  });
});
