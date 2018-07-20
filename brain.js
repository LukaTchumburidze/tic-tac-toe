const express = require('express');
const hbs = require('express-handlebars');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const app = express();

const port = 8081;
app.engine('hbs', hbs({
	extname: 'hbs'
}));

app.set('view engine', '.hbs');
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));



var firstCookie;
var secondCookie;
const cookieLen = 60;

var isEndedInd;
var moves;

var row;
var col;
var mainDiagonal;
var secondaryDiagonal;

var used;
var lastID;

init(3);

function init(len) {
	if (moves !== undefined && moves[moves.length-1] != 10) {
		return false;
	}

	firstCookie = undefined;
	secondCookie = undefined;

	moves = [];
	moves[0] = -1;

	row = [];
	col = [];

	mainDiagonal = {};
	secondaryDiagonal = {};

	used = [];

	isEndedInd = false;

	for (let i = 0; i< len; i++) {
		row[i] = {};
		col[i] = {};
	}

	return true;
}

app.delete('/brain-clear', function (req, res) {
	if (init(3)) {
		res.status(200);
		res.statusMessage = "Restarting the game!";
	} else {
		res.status(403);
		res.statusMessage = "Game have been ended!";
	}
	res.end();
});

function getRandomString(len) {
	let val = "";
	for (let i = 0; i < len; i++) {
		val += String.fromCharCode('a'.charCodeAt(0) + parseInt(Math.random() * 26));
	}
	return val;
}

app.get('/', function (req, res) {
	var cookie = req.cookies.id;

	if (cookie === undefined) {
		cookie = getRandomString(cookieLen);
		res.cookie('id', cookie, { maxAge: 5 * 60 * 1000, httpOnly: true });

		if (firstCookie === undefined) {
			firstCookie = cookie;
		} else {
			if (secondCookie === undefined) {
				secondCookie = cookie;
				lastID = cookie;
			}
		}
	}

	switch (cookie) {
		case firstCookie:
			res.render('index', { isInitiator: true });
			break;
		case secondCookie:
			res.render('index', { isInitiator: false });
			break;
		default:
			res.render('spectator');
	}
});

app.post('/brain-move', function (req, res) {
	var curInd = req.body.index;
	var curID = req.cookies.id;

	if (curID === undefined) {
		res.end();
		return;
	}

	if (isEndedInd) {
		res.status(403);
		res.statusMessage = "Game have been ended!";
		res.end();
		return;
	}

	if (curID != firstCookie && curID != secondCookie) {
		res.status(403);
		res.statusMessage = "You are just spectator!";
		res.end();
		return;
	}


	if (!(curInd > 0 && curInd < 10 && lastID != curID) || used[curInd] !== undefined) {
		res.status(403);
		res.statusMessage = "You can't make this move right now!";
		res.end();
		return;
	}

	console.log(moves.length);
	moves[moves.length] = curInd;
	used[curInd] = curID;
	console.log(moves.length);

	curInd--;
	var quo = parseInt(curInd / 3);
	var rem = curInd % 3;

	if (quo == rem) {
		mainDiagonal[curID] = (mainDiagonal[curID] + 1) || 1;
	}

	if (quo + rem == 2) {
		secondaryDiagonal[curID] = (secondaryDiagonal[curID] + 1) || 1;
	}

	row[quo][curID] = (row[quo][curID] + 1) || 1;
	col[rem][curID] = (col[rem][curID] + 1) || 1;

	lastID = curID;

	var result = getResult();
	if (result !== undefined) {
		isEndedInd = true;
		moves[moves.length] = 10;
		res.status(200);
		res.statusMessage = "End!";
	} else {
		res.status(200);
		res.statusMessage = "Everything is fine!";
	}


	res.end();
});
function getResult() {
	for (var i = 0; i < 3; i++) {
		if (col[i][firstCookie] == 3 || row[i][firstCookie] == 3) {
			return firstCookie;
		}

		if (col[i][secondCookie] == 3 || row[i][secondCookie] == 3) {
			return secondCookie;
		}
	}

	if (mainDiagonal[firstCookie] == 3 || secondaryDiagonal[firstCookie] == 3) {
		return firstCookie;
	}

	if (mainDiagonal[secondCookie] == 3 || secondaryDiagonal[secondCookie] == 3) {
		return secondCookie;
	}

	return undefined;
}

app.post('/brain-spectate', function (req, res) {
	var lastInd = req.body.lastInd;
	var resArr;

	console.log(lastInd);
	console.log(moves);
	for (i = 0; i < moves.length; i++) {
		if (lastInd == moves[i]) {
			resArr = moves.slice(i + 1);
		}
	}

	if (resArr[resArr.length - 1] == 10) {
		res.clearCookie('id');
	}

	if (resArr.length > 0) {
		res.send(resArr);
		res.end();
	}
});

app.listen(port, (err) => {
	if (err) {
		return console.log('something bad happened', err)
	}

	console.log(`server is listening on ${port}`);
});