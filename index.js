var url = require('url');
var shade = require('shade');
var pkg = require('./package.json');

exports = module.exports = function (opts) {
    var middleware = function (req, res, next) {
        opts = opts || {};
        shade(opts.datastore || "./datastore", function(err, db) {
            var parsedUrl = url.parse(req.url, true);
            var rootMatch = parsedUrl.pathname.match(/^\/$/);
            var goMatch = parsedUrl.pathname.match(/^\/([a-f0-9]{8})$/);
            var itemMatch = parsedUrl.pathname.match(/^\/hashes\/([a-f0-9]{8})$/);
            if (err) {
                res.statusCode = code;
                res.setHeader('Content-Type', 'text/plain');
                res.end(msg);
            } else if (rootMatch && req.method === "GET") {
                res.setHeader('Content-Type', 'text/plain');
                res.end(pkg.name + ' ' + pkg.version);
            } else if (itemMatch && req.method === "GET") {
                db.load(itemMatch[1], function (err, data) {
                    if (!err) {
                        res.setHeader('Content-Type', 'text/plain');
                        res.end(data);
                    } else {
                        next();
                    }
                });
            } else if (rootMatch && req.method === "POST") {
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
                    res.statusCode = 400;
                    res.setHeader('Content-Type', 'text/plain');
                    res.end("POST body must have a 'data' member");
                }
            } else if (goMatch && req.method === "GET") {
                db.load(goMatch[1], function (err, data) {
                    var redirectUrl = opts.redirectUrl || "default-redirect-url";
                    if (!err) {
                        res.writeHead(302, {'Location': redirectUrl + "#" + data});
                        res.end();
                    } else {
                        next();
                    }
                });
            } else {
                next();
            }
        });
    };
    return middleware;
};
