var hashbrowns = require('./index');
var connect = require('connect');
var path = require('path');
var app = connect()
    .use(connect.bodyParser())
    .use(hashbrowns({
        datastore: path.join('local', 'datastore'),
        redirectUrl: 'http://example.com'
    }));
app.listen(3000);
