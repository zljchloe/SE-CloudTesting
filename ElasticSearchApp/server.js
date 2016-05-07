var express = require('express');
var app = express();
var elasticsearch = require('elasticsearch');
var global_socket;
app.use(express.static(__dirname + '/public'));

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
// var http = require('http');
// var fs = require('fs');
// var elasticsearch = require('elasticsearch');

// function send404Response(response) {
//     response.writeHead(404, {"Content-Type": "text/plain"});
//     response.write("Error 404: Page Not Found");
//     response.end();
// }

// function onRequest(request, response) {
//     if (request.method == 'GET' && request.url == '/') {
//         response.writeHead(200, {"Content-Type": "text/html"});
//         fs.createReadStream("./twittermap.html").pipe(response);
//     }else {
//         send404Response(response);
//     }
// }
// function searchKey(keyword, socket, data) {
//     var client = new elasticsearch.Client({
//         host: 'http://search-twittmap-22o4jxxy4ggsm3wsjhsvvyu66q.us-east-1.es.amazonaws.com',
//         log: 'trace'
//     });

//     client.search({
//         index: keyword,
//         body: {
//             "from" : 0,
//             "size" : 400
//         }
//     }).then(function (resp) {
//         var hits = resp.hits.hits;
//         var result = [];
//         for (var i = 0; i<hits.length; i++) {
//             console.log(hits[i]);
//             var longtitude = hits[i]._source.longtitude;
//             var latitude = hits[i]._source.latitude;
//             var item = {lat: latitude, lng: longtitude, usr:hits[i]._source.user, txt:hits[i]._source.text, ul:hits[i]._source.url };
//             result.push(item);
//         }
//         console.log(result);
//         socket.emit('marks',{message:result, id:data.id});
//     }, function (err) {
//         socket.emit('error', err.message);
//     });
// }

function search(keyword) {
    var client = new elasticsearch.Client({
        host: 'http://search-twittmap-22o4jxxy4ggsm3wsjhsvvyu66q.us-east-1.es.amazonaws.com',
        log: 'trace'
    });

    client.search({
        q: keyword,
        size: 10000
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
// var app = http.createServer(onRequest);
// console.log("server working...");

// app.listen(8888);
// var io = require('socket.io').listen(app);
// io.on('connect',function(socket){
//     socket.emit('welcome', { message: 'welcome!', id: socket.id });

//     socket.on('keypass',function(data){   
//         var key = data.message;
//         searchKey(key,socket,data);
//     });

// });

app.get('/', function (req, res) {
   res.sendFile(__dirname + '/GoogleMap.html');
});

app.post('/',function(req,res){
    console.log(req.body);
  var keyword=req.body.keyword;
  var period=req.body.time;
  console.log("Keyword = "+ keyword +", period is "+ period);
  search(keyword);
 // res.sendFile(__dirname + '/GoogleMap.html');
  //res.end("yes");
});
 
 // var io = require('socket.io').listen(app);
 io.on('connection', function(socket){
   console.log('a user connected');
   global_socket = socket;
 });