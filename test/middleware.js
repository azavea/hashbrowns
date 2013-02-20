var connect = require('connect');
var path = require('path');
var test = require('./support/tempdirtest');
var request = require('./support/http');
var hashbrowns = require('../index');
var pkg = require('../package.json');

var createApp = function(dataStorePath) {
    return connect()
        .use(connect.bodyParser())
        .use(hashbrowns({
            datastore: dataStorePath,
            redirectUrl: 'http://example.com'
        }));
};

test('GET / returns version number', function (t, tempdir) {
    t.plan(2);
    createApp(tempdir)
        .request()
        .get('/')
        .end(function(res, done) {
            t.equal(res.statusCode, 200);
            t.equals(res.body, pkg.name + ' ' + pkg.version);
            done();
        });
});

test('GET /d22a158c from empty datastore returns 404', function (t, tempdir) {
    t.plan(2);
    createApp(tempdir)
        .request()
        .get('/d22a158c')
        .end(function(res, done) {
            t.equal(res.statusCode, 404);
            t.equals(res.body, 'key not found');
            done();
        });
});

test('GET /bad-key returns 404', function (t, tempdir) {
    t.plan(2);
    createApp(tempdir)
        .request()
        .get('/bad-key')
        .end(function(res, done) {
            t.equal(res.statusCode, 404);
            t.equals(res.body, 'Cannot GET /bad-key');
            done();
        });
});

test('POST sometext returns 201 CREATED and key', function(t, tempdir) {
    t.plan(2);
    createApp(tempdir)
        .request()
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .write('data=sometext')
        .post('/')
        .end(function(res, done) {
            t.equal(res.statusCode, 201);
            t.equals(res.body, 'd22a158c');
            done();
        });
});

test('GET /d22a158c after save triggers redirect', function(t, tempdir) {
    var app = createApp(tempdir);
    t.plan(2);
    app.request()
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .write('data=sometext')
        .post('/')
        .end(function(res, done) {
            done();
            app.request()
                .get('/d22a158c')
                .end(function(res, done) {
                    t.equal(res.statusCode, 302);
                    t.equal(res.headers['location'], 'http://example.com#sometext');
                    done();
                });
        });
});

test('GET /hashes/d22a158c after save returns sometext', function(t, tempdir) {
    var app = createApp(tempdir);
    t.plan(2);
    app.request()
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .write('data=sometext')
        .post('/')
        .end(function(res, done) {
            done();
            app.request()
                .get('/hashes/d22a158c')
                .end(function(res, done) {
                    t.equal(res.statusCode, 200);
                    t.equals(res.body, 'sometext');
                    done();
                });
        });
});