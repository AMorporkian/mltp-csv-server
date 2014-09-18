var koa = require('koa');
var router = require('koa-router');
var Datastore = require('nedb');
var wrap = require('co-nedb');
var bodyParser = require('koa-bodyparser');
var uuid = require('node-uuid');
var json = require('koa-json');
var _ = require('lodash');
var send = require('koa-send');

var adminKey = 'b7c4852a-1231-4b57-9657-dc6aec7e7ed1';

var app = koa();
app.use(bodyParser());
app.use(router(app));
app.use(json());
var keyDB = new Datastore({ filename: "db/key.db", autoload: true });
var apiKeys = wrap(keyDB);

var csvDB = new Datastore({ filename: "db/csv.db", autoload: true });
var csvs = wrap(csvDB);

app.post('/create_key', function * () {
    var body = this.request.body;
    if (!body.adminKey || body.adminKey != adminKey) {
        this.throw(401, "You need to supply a proper admin key to add a user.");
        return;
    }
    if (!body.username) {
        this.throw(500, "You must supply a username.");
        return;
    }
    var newKey = uuid.v4();
    var res = yield apiKeys.findOne({"name": body.username});
    if (!res) {
        yield apiKeys.insert({"name": body.username, "key": newKey});
        this.body = {"name": body.username, key: newKey, "new": true};
    } else {
        this.body = {"name": res.name, "key": res.key, "new": false}
    }
});

app.put('/csv', function * () {
    var body = this.request.body;
    if (!body.key) {
        this.throw(401, "You must supply an API key to submit a CSV.");
        return;
    }
    if (!body.csv) {
        this.throw(500, "You must supply a CSV.")
    }
    var validKey = yield apiKeys.findOne({"key": body.key});
    if (!validKey) {
        this.throw(401, "Invalid API key.");
        return;
    }
    var csvID = uuid.v4();
    yield csvs.insert({"submitter": validKey.name, "csv": body.csv, "id": csvID, "date": new Date()});
    this.body = {"success": true, "id": csvID};
});

app.get('/csv/:id', function * () {
    var csv = yield csvs.findOne({id: this.params.id});
    if (!csv) {
        this.throw(404);
        return;
    }
    this.body = csv.csv;
});

app.get('/csvs', function * () {
    var res = yield csvs.find({});
    this.body = _.map(res, function(curObject) { return _.pick(curObject, "id", "submitter", "date")});
});


app.get('/', function *() {
    yield send(this, __dirname+'/static/index.html');
});
app.get('/app.js', function *() {
    yield send(this, __dirname+'/static/app.js');
});
app.listen(3000);