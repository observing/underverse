describe('Underverse', function () {
  'use strict';

  var Underverse = require('../')
    , chai = require('chai')
    , expect = chai.expect;

  chai.Assertion.includeStack = true;

  it('should be exposed as a function', function () {
    expect(Underverse).to.be.a('function');
  });

  it('should configure the size/length of the ring', function () {
    var uv = new Underverse(100, 0);
    expect(uv.ring.length).to.equal(100);
  });

  it('sets the current position of the cursor', function () {
    var uv = new Underverse(100, 20);

    expect(uv.position).to.equal(20);

    uv.cursor(40);
    expect(uv.position).to.equal(40);
  });

  it('is an EventEmitter', function () {
    var uv = new Underverse();

    expect(uv).to.be.instanceOf(require('events').EventEmitter);
  });

  describe('#cursor', function () {
    it('marks all previous items as set', function () {
      var uv = new Underverse(100)
        , i;

      for (i = 0; i <= 50; i++) {
        expect(uv.ring[i]).to.equal(undefined);
      }

      uv.cursor(50);

      for (i = 51; i <= 100; i++) {
        expect(uv.ring[i]).to.equal(undefined);
      }

      for (i = 0; i <= 50; i++) {
        expect(uv.ring[i]).to.equal(1);
      }
    });
  });

  describe('#received', function () {
    it('marks the slot as received', function () {
      var uv = new Underverse();

      uv.received(0);
      expect(uv.ring[0]).to.equal(1);
    });

    it('should not return true if no cursor was set', function () {
      var uv = new Underverse();

      expect(uv.received(0)).to.equal(false);
      expect(uv.received(1)).to.equal(false);
      expect(uv.received(2)).to.equal(false);
      expect(uv.received(1)).to.equal(false);
      expect(uv.received(6)).to.equal(false);

      expect(uv.ring[3]).to.equal(undefined);
      uv.cursor(10);
      expect(uv.ring[3]).to.equal(1);

      expect(uv.received(9)).to.equal(false);
      expect(uv.received(10)).to.equal(false);
      expect(uv.received(11)).to.equal(true);
    });

    it('returns true if the id was in order', function () {
      var uv = new Underverse();
      uv.cursor(-1);

      expect(uv.received(0)).to.equal(true);
      expect(uv.received(1)).to.equal(true);
      expect(uv.received(2)).to.equal(true);
      expect(uv.received(1)).to.equal(false);
      expect(uv.received(6)).to.equal(false);
    });

    it('emits `fetch` when data is missing', function (done) {
      var uv = new Underverse();
      uv.cursor(-1);

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
      uv.cursor(-1);

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
      uv.cursor(-1);

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

      uv.cursor(-1);

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

  describe('#next', function () {
    it('correctly identifies the next item', function () {
      var uv = new Underverse(100);
      uv.cursor(-1);

      expect(uv.next(0)).to.equal(true);
      uv.received(0);
      expect(uv.next(0)).to.equal(false);
      expect(uv.next(1)).to.equal(true);
      expect(uv.next(10)).to.equal(false);
    });

    it('supports overflowing', function () {
      var uv = new Underverse(100);
      uv.cursor(100);

      expect(uv.next(100)).to.equal(false);
      expect(uv.next(0)).to.equal(true);
    });
  });
});
