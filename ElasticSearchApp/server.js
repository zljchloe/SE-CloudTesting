var express = require('express');
var session = require('express-session');
var elasticsearch = require('elasticsearch');
var app = express();
app.use(express.static(__dirname + '/public'));
app.use(session({
    secret: 's_secret',
    resave: true,
    saveUninitialized: true
}));
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

var bodyParser = require('body-parser')
app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
})); 

var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
server.listen(8081, function () {
  console.log('listening on port 8081!');
});

var global_socket;
var global_user;
var sess;


function search(keyword) {
    var client = new elasticsearch.Client({
        host: 'http://search-twittmap-22o4jxxy4ggsm3wsjhsvvyu66q.us-east-1.es.amazonaws.com',
        log: 'trace'
    });

    client.search({
        q: keyword,
        size: 100000
        // body: {
        //     // "aggs": {
        //     //     "last_hour": {
        //     //         "filter": {
        //     //             "range":{
        //     //                "_source.createdTime": { 
        //     //                     "gte": "Fri May 06 00:03:43 EDT 2016"
        //     //                   }
        //     //             }
        //     //         }
        //     //     }
        //     // }
        //     "from" : 0,
        //     "size" : 1000
        // }

    }).then(function (resp) {
        var hits = resp.hits.hits;
        var result = [];
        for (var i = 0; i<hits.length; i++) {
            console.log(hits[i]);
            var lon = hits[i]._source.longtitude;
            var lat = hits[i]._source.latitude;
            //var item = {lat: latitude, lng: longtitude, usr:hits[i]._source.user, txt:hits[i]._source.text, ul:hits[i]._source.url, time:hits[i]._source.createdTime};
            var item = {Latitude : lon, Longitude: lat};
            result.push(item);
        }
        console.log(result);
        global_socket.emit('marks',{message:result, id:global_socket.id});
    }, function (err) {
        global_socket.emit('error', err.message);
    });
}


app.get('/', function (req, res) {
   res.sendFile(__dirname + '/signin.html');
});

app.post('/signin', function (req, res) {
   sess = req.session;
   sess.user = req.body.user;
   res.send('done');
});

app.get('/map', function (req, res) {
   sess = req.session;
  res.render("GoogleMap", {user: sess.user});

});

app.post('/map', function (req, res) {
  var keyword=req.body.keyword;
  var period=req.body.time;
  console.log("Keyword = "+ keyword +", period is "+ period);
  search(keyword);
  res.send('done');
});

 
 io.on('connection', function(socket){
   console.log('a user connected');
   global_socket = socket;
 });
