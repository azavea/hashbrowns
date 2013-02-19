var url = require('url');
var shade = require('shade');
var pkg = require('./package.json');

var keyNotFound = function (res) {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'text/plain');
    res.end("key not found");
};

var badRequest = function (res, msg) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'text/plain');
    res.end(msg);
};

exports = module.exports = function (opts) {
    opts = opts || {};

    var handlers = [
        {
            pattern: /^\/$/,
            GET: function getRoot (db, match, req, res, next) {
                res.setHeader('Content-Type', 'text/plain');
                res.end(pkg.name + ' ' + pkg.version);
            },
            POST: function postRoot (db, match, req, res, next) {
                 if (req.body && req.body.data) {
                    res.setHeader('Content-Type', 'text/plain');
                    db.save(req.body.data, function (err, key) {
                        if (!err) {
                            res.end(key);
                        } else {
                            res.statusCode = 500;
                            res.end('Save failure');
                        }
                    });
                } else {
                    badRequest(res, 'POST body must have a "data" member');
                }
            }
        },
        {
            pattern: /^\/([a-f0-9]{8})$/,
            GET: function getData (db, match, req, res, next) {
                db.load(match[1], function (err, data) {
                    var redirectUrl = opts.redirectUrl || "default-redirect-url";
                    if (!err) {
                        res.writeHead(302, {'Location': redirectUrl + "#" + data});
                        res.end();
                    } else {
                        keyNotFound(res);
                    }
                });
            }
        },
        {
            pattern: /^\/hashes\/([a-f0-9]{8})$/,
            GET: function getRedirect (db, match, req, res, next) {
                db.load(match[1], function (err, data) {
                    if (!err) {
                        res.setHeader('Content-Type', 'text/plain');
                        res.end(data);
                    } else {
                        keyNotFound(res);
                    }
                });
            }
        }
    ];

    var middleware = function (req, res, next) {
        shade(opts.datastore || "./datastore", function(err, db) {
            var i, handled, match;
            var pathname = url.parse(req.url).pathname;
            if (!err) {
                for (i = 0; i < handlers.length; i++) {
                    match = pathname.match(handlers[i].pattern);
                    if (match && handlers[i][req.method]) {
                        handlers[i][req.method](db, match, req, res, next);
                        handled = true;
                        break;
                    }
                }
                if (!handled) {
                    next();
                }
            } else {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'text/plain');
                res.end("data store failure");
            }
        });
    };

    return middleware;
};
