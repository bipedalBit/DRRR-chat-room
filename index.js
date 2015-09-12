// Setup basic express server
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var crypto = require('crypto');
var mysql = require('mysql');
// keep sockets alive
server.setTimeout(0);
// tool functions
function encryptPwd(salt, pwd) {
	// do not use the same algorithm
	var digest = ((salt.length & 1) == 1) ? 'sha1' : 'md5';
	return crypto.pbkdf2Sync(pwd, salt, 1<<12, 32, digest).toString('hex');
}
function getRandomNum(floor, ceiling) {
	var range = ceiling - floor;
	var random = Math.random();
	return (floor + Math.ceil(range * random));
}
function getInviteCode() {
	var chars = [
		'1', '2', '3', '4', '5', '6', '7', '8', '9', '0', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H',
		'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'
	];
	var code = '';
	for( var i = 0; i < 4; i++) {
		code += chars[getRandomNum(0, 35)];
	}
	return code;
}

// DB preparation
var conn = mysql.createConnection({
	host: 'localhost',
	user: 'root',
	password: 'root'
});
var DATABASE = 'drrr_chat_room_db';
var USER_TABLE = 't_user';
// try to create database
conn.query(
	'CREATE DATABASE IF NOT EXISTS ' + DATABASE +
	' DEFAULT CHARSET utf8 COLLATE utf8_bin',
	function(err) {
		if (err) {
			throw err;
		}
	}
);
// try to create user table
conn.query('USE ' + DATABASE);
conn.query(
	'CREATE TABLE IF NOT EXISTS ' + USER_TABLE +
	'(`username` NVARCHAR(32), ' +
	'`password` CHAR(64) NOT NULL, ' +
	'`simpname` NVARCHAR(4) NOT NULL, ' +
	'`color` CHAR(6) NOT NULL, ' +
	'`invitecode` CHAR(4) NOT NULL, ' +
	'PRIMARY KEY (`username`))',
	function (err) {
		if (err) {
			throw err;
		}
	}
);
// try to create adminisrator user
var adminInfo = {
	username: 'admin',
	password: encryptPwd('admin', 'secret'),
	simpname: '管',
	color: 'FF0000',
	invitecode: getInviteCode()
};
var args = [USER_TABLE, adminInfo, 'password', 'password'];
var sql = 'INSERT INTO ?? SET ? ON DUPLICATE KEY UPDATE ?? = ??';
sql = mysql.format(sql, args);
conn.query(sql, function (err) {
	if (err) {
		throw err;
	}
});

var port = process.env.PORT || 3000;

server.listen(port, function () {
	console.log('Server listening at port %d', port);
});

// Routing
// Better to put index.js and '/public' in different place to avoid exposing encrypt method
app.use(express.static(__dirname + '/public'));

// usernames which are currently connected to the chat
var usernames = {};
var numUsers = 0;

io.on('connection', function (socket){
	var addedUser = false;

	socket.on('login', function (data) {
		var id = data.username;
		var pwd = encryptPwd(id, data.password);
		var sql = 'SELECT ?? FROM ?? WHERE ?? = ? AND ?? = ?';
		var colums = ['simpname', 'color'];
		var args = [colums, USER_TABLE, 'username', id, 'password', pwd];
		sql = mysql.format(sql, args);
		conn.query(sql, function (err, res) {
			if (err) {
				throw err;
			}
			var data2 = new Object();
			if (res.length > 0) {
				data2.simpName = res[0].simpname;
				data2.color = res[0].color;
				data2.res = 0;
				if(usernames[id] == id) {
					data2.res = 1;
				}
			} else{
				data2.res = 2;
			}
			if(data2.res == 0) {
				data2.type = data.type;
				// we store the username and other infomation in the socket session for this client
				socket.username = id;
				socket.simpName = data2.simpName;
				socket.color = data2.color;
				// add the client's username to the global list
				usernames[id] = id;
				++numUsers;
				addedUser = true;
			}
			socket.emit('login', data2);
		});
	});

	socket.on('to chat room', function () {
		// echo back to show welcome message
		socket.emit('user joined', {
			username: socket.username,
			userNum: numUsers,
			self: true
		});
	});

	socket.on('user joined', function () {
		// echo globally (all clients) that a person has connected
		socket.broadcast.emit('user joined', {
			username: socket.username,
			userNum: numUsers
		});
	});

	socket.on('invite code', function () {
		var sql = 'SELECT ?? FROM ?? WHERE ?? = ?';
		var args = ['invitecode', USER_TABLE, 'username', socket.username];
		sql = mysql.format(sql, args);
		conn.query(sql, function (err, res) {
			if (err) {
				throw err;
			}
			socket.emit('invite code', res[0].invitecode);
		});
	});

	socket.on('invite validate', function (data) {
		var sql = 'SELECT 1 FROM ?? WHERE ?? = ? AND ?? = ?';
		var args = [USER_TABLE, 'username', data.inviter, 'invitecode', data.code];
		sql = mysql.format(sql, args);
		conn.query(sql, function (err, res) {
			if (err) {
				throw err;
			}
			if (res.length > 0) {
				sql = 'UPDATE ?? SET ?? = ? WHERE ?? = ?';
				args = [USER_TABLE, 'invitecode', getInviteCode(), 'username', data.inviter];
				sql = mysql.format(sql, args);
				conn.query(sql, function (err) {
					if (err) {
						throw err;
					}
				});
				socket.emit('invite validate', true);
			} else{
				socket.emit('invite validate', false);
			}
		});
	});

	socket.on('name check', function (id) {
		var sql = 'SELECT 1 FROM ?? WHERE ?? = ? LIMIT 1';
		var args = [USER_TABLE, 'username', id];
		sql = mysql.format(sql, args);
		conn.query(sql, function (err, res) {
			if (err) {
				throw err;
			}
			if (res.length > 0) {
				socket.emit('name check', false);
			} else{
				socket.emit('name check', true);
			}
		});
	});

	socket.on('register', function (data) {
		var sql = 'INSERT INTO ?? SET ?';
		var values = {
			username: data.username,
			password: encryptPwd(data.username, data.password),
			simpname: data.simpName,
			color: data.color,
			invitecode: getInviteCode()
		};
		var args = [USER_TABLE, values];
		sql = mysql.format(sql, args);
		conn.query(sql, function (err) {
			if (err) {
				throw err;
			}
		});
	});

	// when the client emits 'new message', this listens and executes
	socket.on('new message', function (msg){
		// we tell the client to execute 'new message'
		socket.broadcast.emit('new message', {
			username: socket.username,
			simpName: socket.simpName,
			color: socket.color,
			message: msg
		});
	});

	// when the user disconnects.. perform this
	socket.on('disconnect', function () {
		// remove the username from global usernames list
		if (addedUser) {
			delete usernames[socket.username];
			--numUsers;
			// echo globally that this client has left
			socket.broadcast.emit('user left', {
				username: socket.username,
				userNum: numUsers
			});
		}
	});
});