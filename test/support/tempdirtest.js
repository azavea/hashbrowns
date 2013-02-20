var test = require('tape');
var temp = require('temp');

/*
This wrapper around a tape test creates a temporary directory
and passes tha path as a second argument to the tape callback.
*/
exports = module.exports = function(name, cb) {
    if (!cb) { return; }
    temp.mkdir('hashbrowns-test-', function(err, dir) {
        test(name, function (t) {
            if (!err) {
                cb(t, dir);
            } else {
                t.fail(err);
            }
        });
    });
};