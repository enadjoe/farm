import sirv from 'sirv';
import http from 'http';
import express from 'express';
import compression from 'compression';
import socketIo from 'socket.io';
import * as sapper from '@sapper/server';
import { object_without_properties } from 'svelte/internal';

const { PORT, NODE_ENV } = process.env;
const dev = NODE_ENV === 'development';

const app = express();

app
	.use(
        compression({ threshold: 0 }),
        sirv('static', { dev }),
        sapper.middleware({
            session: (req, res) => ({
                user: req.user
            })
        })
    );

const server = http.createServer(app);

const io = socketIo(server); // < Interesting!

var rooms = {}

function createRoom(name) {
  rooms[name] = {
    playerInfo: {},
    playerLocations: {},
    playerSpeak: {},
    playerChat: [],
    playerScores: {},
    gamePieces: [],
    hasActiveGame: false,
  }
  console.log('room: ' + name + ' created')
}

function destroyRoom(name) {
  if (rooms[name]) {
    delete rooms[name]
    console.log('room: ' + name + ' deleted')
  } else {
    console.error('tried to delete non-existant room: ' + name)
  }
}
function uuidv4() {
  return 'xxxxxxxxxxx42098xxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
  var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
  return v.toString(16);
});
}
function genRand(num) {
  return Math.floor((Math.random() * num) + 1)
}

var emojis = [
	'😄','😃','😀','😊','☺','😉','😍','😘','😚','😗','😙','😜','😝','😛','😳','😁','😔','😌','😒','😞','😣','😢','😂','😭','😪','😥','😰','😅','😓','😩','😫','😨','😱','😠','😡','😤','😖','😆','😋','😷','😎','😴','😵','😲','😟','😦','😧','😈','👿','😮','😬','😐','😕','😯','😶','😇','😏','😑','👲','👳','👮','👷','💂','👶','👦','👧','👨','👩','👴','👵','👱','👼','👸','😺','😸','😻','😽','😼','🙀','😿','😹','😾','👹','👺','🙈','🙉','🙊','💀','👽','💩','🔥','✨','🌟','💫','💥','💢','💦','💧','💤','💨','👂','👀','👃','👅','👄','👍','👎','👌','👊','✊','✌','👋','✋','👐','👆','👇','👉','👈','🙌','🙏','☝','👏','💪','🚶','🏃','💃','👫','👪','👬','👭','💏','💑','👯','🙆','🙅','💁','🙋','💆','💇','💅','👰','🙎','🙍','🙇','🎩','👑','👒','👟','👞','👡','👠','👢','👕','👔','👚','👗','🎽','👖','👘','👙','💼','👜','👝','👛','👓','🎀','🌂','💄','💛','💙','💜','💚','❤','💔','💗','💓','💕','💖','💞','💘','💌','💋','💍','💎','👤','👥','💬','👣','💭','🐶','🐺','🐱','🐭','🐹','🐰','🐸','🐯','🐨','🐻','🐷','🐽','🐮','🐗','🐵','🐒','🐴','🐑','🐘','🐼','🐧','🐦','🐤','🐥','🐣','🐔','🐍','🐢','🐛','🐝','🐜','🐞','🐌','🐙','🐚','🐠','🐟','🐬','🐳','🐋','🐄','🐏','🐀','🐃','🐅','🐇','🐉','🐎','🐐','🐓','🐕','🐖','🐁','🐂','🐲','🐡','🐊','🐫','🐪','🐆','🐈','🐩','🐾','💐','🌸','🌷','🍀','🌹','🌻','🌺','🍁','🍃','🍂','🌿','🌾','🍄','🌵','🌴','🌲','🌳','🌰','🌱','🌼','🌐','🌞','🌝','🌚','🌑','🌒','🌓','🌔','🌕','🌖','🌗','🌘','🌜','🌛','🌙','🌍','🌎','🌏','🌋','🌌','🌠','⭐','☀','⛅','☁','⚡','☔','❄','⛄','🌀','🌁','🌈','🌊','🎍','💝','🎎','🎒','🎓','🎏','🎆','🎇','🎐','🎑','🎃','👻','🎅','🎄','🎁','🎋','🎉','🎊','🎈','🎌','🔮','🎥','📷','📹','📼','💿','📀','💽','💾','💻','📱','☎','📞','📟','📠','📡','📺','📻','🔊','🔉','🔈','🔇','🔔','🔕','📢','📣','⏳','⌛','⏰','⌚','🔓','🔒','🔏','🔐','🔑','🔎','💡','🔦','🔆','🔅','🔌','🔋','🔍','🛁','🛀','🚿','🚽','🔧','🔩','🔨','🚪','🚬','💣','🔫','🔪','💊','💉','💰','💴','💵','💷','💶','💳','💸','📲','📧','📥','📤','✉','📩','📨','📯','📫','📪','📬','📭','📮','📦','📝','📄','📃','📑','📊','📈','📉','📜','📋','📅','📆','📇','📁','📂','✂','📌','📎','✒','✏','📏','📐','📕','📗','📘','📙','📓','📔','📒','📚','📖','🔖','📛','🔬','🔭','📰','🎨','🎬','🎤','🎧','🎼','🎵','🎶','🎹','🎻','🎺','🎷','🎸','👾','🎮','🃏','🎴','🀄','🎲','🎯','🏈','🏀','⚽','⚾','🎾','🎱','🏉','🎳','⛳','🚵','🚴','🏁','🏇','🏆','🎿','🏂','🏊','🏄','🎣','☕','🍵','🍶','🍼','🍺','🍻','🍸','🍹','🍷','🍴','🍕','🍔','🍟','🍗','🍖','🍝','🍛','🍤','🍱','🍣','🍥','🍙','🍘','🍚','🍜','🍲','🍢','🍡','🍳','🍞','🍩','🍮','🍦','🍨','🍧','🎂','🍰','🍪','🍫','🍬','🍭','🍯','🍎','🍏','🍊','🍋','🍒','🍇','🍉','🍓','🍑','🍈','🍌','🍐','🍍','🍠','🍆','🍅','🌽','🏠','🏡','🏫','🏢','🏣','🏥','🏦','🏪','🏩','🏨','💒','⛪','🏬','🏤','🌇','🌆','🏯','🏰','⛺','🏭','🗼','🗾','🗻','🌄','🌅','🌃','🗽','🌉','🎠','🎡','⛲','🎢','🚢','⛵','🚤','🚣','⚓','🚀','✈','💺','🚁','🚂','🚊','🚉','🚞','🚆','🚄','🚅','🚈','🚇','🚝','🚋','🚃','🚎','🚌','🚍','🚙','🚘','🚗','🚕','🚖','🚛','🚚','🚨','🚓','🚔','🚒','🚑','🚐','🚲','🚡','🚟','🚠','🚜','💈','🚏','🎫','🚦','🚥','⚠','🚧','🔰','⛽','🏮','🎰','♨','🗿','🎪','🎭','📍','🚩','⬆','⬇','⬅','➡','🔠','🔡','🔤','↗','↖','↘','↙','↔','↕','🔄','◀','▶','🔼','🔽','↩','↪','ℹ','⏪','⏩','⏫','⏬','⤵','⤴','🆗','🔀','🔁','🔂','🆕','🆙','🆒','🆓','🆖','📶','🎦','🈁','🈯','🈳','🈵','🈴','🈲','🉐','🈹','🈺','🈶','🈚','🚻','🚹','🚺','🚼','🚾','🚰','🚮','🅿','♿','🚭','🈷','🈸','🈂','Ⓜ','🛂','🛄','🛅','🛃','🉑','㊙','㊗','🆑','🆘','🆔','🚫','🔞','📵','🚯','🚱','🚳','🚷','🚸','⛔','✳','❇','❎','✅','✴','💟','🆚','📳','📴','🅰','🅱','🆎','🅾','💠','➿','♻','♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓','⛎','🔯','🏧','💹','💲','💱','©','®','™','〽','〰','🔝','🔚','🔙','🔛','🔜','❌','⭕','❗','❓','❕','❔','🔃','🕛','🕧','🕐','🕜','🕑','🕝','🕒','🕞','🕓','🕟','🕔','🕠','🕕','🕖','🕗','🕘','🕙','🕚','🕡','🕢','🕣','🕤','🕥','🕦','✖','➕','➖','➗','♠','♥','♣','♦','💮','💯','✔','☑','🔘','🔗','➰','🔱','🔲','🔳','◼','◻','◾','◽','▪','▫','🔺','⬜','⬛','⚫','⚪','🔴','🔵','🔻','🔶','🔷','🔸','🔹'
];

function initGame(numPieces) {
  var gamePieces = {};
  for (var i=0; i<numPieces; i++) {
    gamePieces[uuidv4()] = [genRand(500), genRand(500), false, emojis[genRand(emojis.length)]];
  }
  return gamePieces;
}
function initScores(room) {
  var scores = {}
  rooms[room].playerScores = {}
  Object.keys(rooms[room].playerInfo).forEach((id) => {
    rooms[room].playerScores[id] = 0;
  })
}

function endGame(room) {
  if (room) {
    rooms[room].gamePieces = {}
    initScores(room);
  }
}

function getWinner(room) {
  if (room) {
    var winner = ['foo', 0];
    Object.entries(playerScores).forEach(([id, score])=> {
      if (score > winner[1]) {
        winner = [id, score];
      }
    })
  }
  return winner;
}

io.on("connection", socket => {
  console.log("Client connected:", socket.id);
  var room;

  socket.on('initalize', (msg) => {
    room = msg.info.room
    socket.join(room)
    console.log('initalizing',msg)
    if (!rooms[room]) {
      createRoom(room)
    }
    rooms[room].playerScores[socket.id] = 0;
    rooms[room].playerLocations[socket.id] = msg.location
    rooms[room].playerInfo[socket.id] = msg.info
    io.to(room).emit('new player', {info: rooms[room].playerInfo, 
                                    locations: rooms[room].playerLocations,
                                    scores: rooms[room].playerScores})
    console.log('got player locations', rooms[room].playerLocations, room)
  })

  socket.on('player speak', (status) => {
    if (room) {
      rooms[room].playerSpeak[socket.id] = status
      io.to(room).emit('player speak', status)
    }
  })

  socket.on('start game', (numPieces) => {
    if (room) {
      rooms[room].gamePieces = initGame(numPieces);
      initScores(room);
      io.to(room).emit('start game', {pieces: rooms[room].gamePieces, scores: rooms[room].playerScores});
    }
  })

  socket.on('end game', () => {
    if (room) {
      endGame();
      io.to(room).emit('end game', rooms[room].playerScores);
    }
  })

  socket.on('player score', (piece) => {
    if (room) {
      rooms[room].playerScores[socket.id] += 1
      rooms[room].gamePieces[piece[0]][2] = true;
      console.log('got game scores', rooms[room].playerScores)
      io.to(room).emit('player score', {scores: rooms[room].playerScores, pieces: rooms[room].gamePieces})
      /*
      var isEndGame = true;
      Object.values(rooms[room].gamePieces).forEach((piece) => {
        if (piece[2] == false) {
          isEndGame = false;
          endGame();
          var winner = getWinner(room);
          io.to(room).emit('end game', [winner, rooms[room].playerScores]);
        }
      })
      */

    }
  })

  socket.on('player message', (message) => {
    if (room) {
      rooms[room].playerChat.push(message);
      io.to(room).emit('player message', message);
    }
  })

  socket.on('player move', (location) => {
    if (room) {
      rooms[room].playerLocations[socket.id] = location
      // console.log('got player move', location)

      io.to(room).emit('player move', [socket.id, location]);
    }
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected", socket.id);
    if (room) {
      io.to(room).emit('player disconnected', rooms[room].playerInfo[socket.id]);
      delete rooms[room].playerInfo[socket.id];
      delete rooms[room].playerLocations[socket.id];
      delete rooms[room].playerScores[socket.id];
      if(Object.keys(rooms[room].playerInfo).length < 1) {
        destroyRoom(room) //if last player out, destroy room
      }
    }
  });
});

server.listen(PORT, () => console.log(`Listening on port ${PORT}`));
