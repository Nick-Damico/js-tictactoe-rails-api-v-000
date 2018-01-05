// Code your JavaScript / jQuery solution here

////////////////////////////////////////////////////////
// Global Variables
////////////////////////////////////////////////////////

// var currentGameId = 0; game.id from currentGame.id below;
var winningCombo = [
  [0,1,2], // TOP ROW
  [3,4,5], // MIDDLE ROW
  [6,7,8], // BOTTOM ROW
  [0,3,6], // FIRST COLUMN
  [1,4,7], // MIDDLE COLUMN
  [2,5,8], // LAST COLUMN
  [0,4,8], // DIAGONAL TOP LEFT, BOTTOM RIGHT
  [2,4,6]  // DIAGONAL TOP RIGHT, BOTTOM LEFT
];



////////////////////////////////////////////////////////
// DOM Elements
////////////////////////////////////////////////////////

var squares = document.getElementsByTagName('td');



////////////////////////////////////////////////////////
// Global General Functions
////////////////////////////////////////////////////////

function toArr(collection){
	let arr = Array.prototype.slice.call(collection);
	return arr.map(function(a) { return a.textContent; })
}

function isEven(num) {
  return num % 2 === 0;
}



////////////////////////////////////////////////////////
// Constructors
////////////////////////////////////////////////////////

////////////////////////
// Board Constructor
////////////////////////

class Board {

  static reset() {
    [].forEach.call(squares, s => {
  	   $(s).html("");
    });
  }

  static buildBtn(game) {
    return `<button id="${game.id}">Game ${game.id}</button>`;
  }

  static appendGamesBtn(btn) {
    $('#games').append(btn);
  }

}

////////////////////////
// Game Constructor
////////////////////////

class Game {

  constructor(id,turnCount, state) {
    id ? this.id = id : this.id = 0;
    turnCount ? this.turnCount = turnCount : this.turnCount = 0;
    state ? this.state = state : this.state = ["","","","","","","","",""];
    Game.all(this);
    this.won = false;
  }

  // CLASS METHODS()

  static all(obj) {
    if (this.log === undefined) {
      this.log = [];
    }
    if (obj) {
      if ( Array.isArray(obj) ){
        for(let inst of obj) {
          this.buildGame(inst);
        }
      } else {
        this.log.push(obj);
      }
    }
    return this.log;
  }

  static buildGame(obj) {
    let board = obj.attributes.state;
    let count = board.filter((value) => value !== "").length;
    return new Game(obj.id, count, board);
  }

  static find_by_id(id) {
    return this.log.filter((game) => game.id === id)[0];
  }

  static last() {
    let gameArr = this.log;
    return gameArr[gameArr.length - 1]
  }

  static newGame() {
    Board.reset();
    return currentGame = new Game;
  }

  static restoreGame(button) {
    let id = $(button).attr("id");
    currentGame = Game.find_by_id( id );
    for(let i = 0; i < squares.length; i++) {
      $(squares[i]).html( currentGame.state[i] );
    }
  }

  static save() {
    if ( currentGame.id ) {
      $.ajax({
        type: 'PATCH',
        url: '/games/' + currentGame.id,
        data: {state: currentGame.state},
        dataType: 'json'
      }).done(function(json) {
        console.log(`Game ${json.data.id} updated.`);
      });
    } else {
      $.post('/games', {state: currentGame.state})
       .done(function(data) {
         let game = data.data;
         currentGame.id = game.id;
         Board.appendGamesBtn( Board.buildBtn( currentGame ) );
       });
    }
  }

  // INSTANCE METHODS()

  currentGame() {
    return this;
  }

  player() {
    return isEven(this.turnCount) ? 'X' : 'O';
  }

  updateState(square) {
    if ( $(square).is(':empty') ) {
      $(square).html(this.player());
      this.state = toArr(squares);
      return true;
    }
    return false;
  }

  doTurn(square) {
    // invokes updateState(square);
    if (!this.won) {
      let updated = this.updateState(square)
      // invokes checkWinner();
      if ( !this.checkWinner() && updated ) {
        // increments this.turnCount
        ++this.turnCount;
      }
    }
    if ( this.turnCount === 9 ) {
      this.setMessage('Tie Game.');
      Game.save();
      Game.newGame();
    }
  }

  setMessage(msg) {
    $('#message').html(msg);
  }

  checkWinner() {
    let table = toArr(squares);
    for (let combo of winningCombo) {
      if(table[combo[0]] !== '' && table[combo[0]] === table[combo[1]] && table[combo[1]] === table[combo[2]]) {
        this.setMessage(`Player ${this.player()} Won!`);
        this.won = true;
        Game.save();
        return true;
      }
    }
    return false;
  }

}



////////////////////////////////////////////////////////
// Events | Listeners
////////////////////////////////////////////////////////

function attachListeners() {
  tableListner();
  previousBtnListener();
  saveBtn();
  clearBtn();
  gameBtns();
}

function tableListner() {
  $('table').on('click', 'td', function(e) {
    currentGame.doTurn(e.target);
  });
}

function previousBtnListener() {
  $('#previous').on('click', previousGames )
}

function saveBtn() {
  $('#save').on('click', Game.save);
}

function clearBtn() {
  $('#clear').on('click', Game.newGame);
}

function gameBtns() {
  $('#games').on('click', 'button', function(e) {
    Game.restoreGame(e.target);
  });
}

////////////////////////////////////////////////////////
// AJAX | API Requests
////////////////////////////////////////////////////////

function previousGames() {
  if ( $('#games').children().length === 0 ) {
  $.get('/games')
    .done(function(data) {
      let gamesData = data.data;
      if ( Game.all().length === 1) {
        Game.all(gamesData);
      }
      let games = Game.all();
      for(let i = 1; i < games.length; i++) {
        Board.appendGamesBtn( Board.buildBtn(games[i]) );
      }
    });
  }
}

////////////////////////////////////////////////////////
// DOM Ready Function
////////////////////////////////////////////////////////

$(function() {
  // Attach Listeners
  attachListeners();
  // instantiate Game instance at browser load.
  currentGame = new Game();
});
