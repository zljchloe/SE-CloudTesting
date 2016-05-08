var express = require('express');
var session = require('express-session');
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

var mysql = require('mysql');
var global_socket;
var global_user;
var sess;

var connection = mysql.createConnection({
  host     : 'tweetdata.c83g2woipxnr.us-east-1.rds.amazonaws.com',
  user     : 'tweetData',
  password : 'greenmilktea',
  database : 'tweetData',
  port     : '3306'
});
connection.connect();

function search(key, time) {
	var str ;
	if(key == 'job' || key == 'fashion' || key == 'love' || key == 'food')
		str = "SELECT * FROM Tweets Where Keyword = '" + key + "'";
	else
		str = "SELECT * FROM Tweets Where Content like '%" + key + "%'";
	if(time == 0)
		str += "and Time between now() - INTERVAL 360 MINUTE and now();";
	else if (time == 1)
		str += "and Time between now() - INTERVAL 1 DAY and now();"; 
	else if (time == 2)
		str += "and Time between now() - INTERVAL 2 DAY and now();"; 
	else
		str += ";";

    console.log (str);
	connection.query(str, function(err, rows, fields) {
		if (err) throw err;
		var result = [];
	  	for (var i in rows) {
	        var lat = rows[i].Latitude;
	        var lon = rows[i].Longitude;
	        var item = {Latitude : lat, Longitude: lon};
	        result.push(item);
		}
	console.log(result);
		global_socket.emit('marks',{message:result, id:global_socket.id});
	});
}

function register(user, password) {
	var str;
	str = "INSERT INTO USER values('" + user + "', '" + password + "' )";
	connection.query(str, function(error) {
		if (error) {
            console.log(error.message);
        } else {
            console.log('success');    
        }
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
  search(keyword, period);
  res.send('done');
});

 
 io.on('connection', function(socket){
   console.log('a user connected');
   global_socket = socket;
 });
