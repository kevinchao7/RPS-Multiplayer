$(document).ready(function() {
  // Initialize Firebase
  var config = {
    apiKey: "AIzaSyATLBR6NxaUaZq-bcj27XN0K0_BmOKIKWk",
    authDomain: "rps-multiplayer-43a60.firebaseapp.com",
    databaseURL: "https://rps-multiplayer-43a60.firebaseio.com",
    projectId: "rps-multiplayer-43a60",
    storageBucket: "",
    messagingSenderId: "12528963406"
  };
  firebase.initializeApp(config);

  var database = firebase.database();
  // Grabs input text
  var input = $('#keyWord');
  // Toast Time before disappearing
  var toastTime = 4000;
  // Current Screen name
  var screenName = undefined;
  var playerNumber = undefined;
  var opponentNumber = undefined;
  // Player options
  var playerOpt = $('#player-options');
  var chatHist = $('#chat-history');
  var player2 = $('#player2');
  var player2Card = $('#player2-card');
  var status = $('#status');
  var playerScore = $('#playerScore');
  var opponentScore = $('#opponentScore');
  // Last message by opponentNumber
  var lastMsg = '';
  // Boolean for opponent loading
  var opponentLoaded = false;
  var opponentName = undefined;
  var playerDecide = undefined;
  var opponentDecide = undefined;
  var madeDecision = false;
  // Counters
  var playerWins = 0;
  var playerLosses = 0;
  var playerTies = 0;
  var opponentWins = 0;
  var opponentLosses = 0;
  var opponentTies = 0;


  // Send chat
  $('#sendChat').on('click', function(value) {
    event.preventDefault();
    // Checks if text is in inputfield and limits string size
    if (input.val() != '' && input.val().length < 100 && playerNumber != undefined) {
      sendMessage(screenName + ': '+input.val(), true, true,'rectangle');
    } else if (input.val().length > 100) {
      sendMessage('Error: Please enter less than 100 characters at a time.', false,false, 'rounded');
    }
    input.val('');
  });

  function sendMessage(message, boolLogHist, logData, toastShape) {
    // Appends chat history
    if (boolLogHist) {
      Materialize.toast(message, toastTime, toastShape);
      var pTag = $('<p>');
      pTag.text(message);
      $('#chat-history').append(pTag);

      // Load chat to firebase
      var obj = {
        'msg': message
      }
      if (logData){
        database.ref().child('chat').child(playerNumber).set(obj);
      }

      // Removes first child if too much in chat history.
      var childrenCount = chatHist.children().length;
      if (childrenCount > 7) {
        chatHist.find('p').first().remove();
      }
    } else {
      Materialize.toast(message, toastTime, toastShape);
    }
  }



  // Feature Discovery Menu
  $('.tap-target').tapTarget('open');
  $('.tap-target').tapTarget('close');

  // media query event handler
  if (matchMedia) {
    const mq = window.matchMedia("(min-width: 600px)");
    mq.addListener(WidthChange);
    WidthChange(mq);
  }

  // Call Functions when media query changes.
  function WidthChange(mq) {
    if (mq.matches) {
      // window width is at least 600px
      $("html, body").animate({
        scrollTop: 0
      }, "slow");
    } else {
      // window width is less than 600px
    }

  }

  // On Click event for adding users
  $('#createUserBtn').on('click', function() {
    event.preventDefault();
    // Only allows you to create a user if no 2 current people are playing.
    database.ref().once('value',function(snapshot){
      console.log(snapshot.child('players').numChildren());
      if (snapshot.child('players').numChildren() < 2){
        // Create user object
        var obj = {
          name: $('#userName').val(),
          wins: 0,
          losses: 0,
          ties: 0
        };
        $('#player1').text(obj.name);

        screenName = obj.name;

        // Assigns player number
        database.ref().child('players').once('value', function(snapshot) {
          var playerSnap = snapshot.val();

          if (playerSnap === null) {
            playerNumber = '1';
            opponentNumber = '2';
          } else if (playerSnap['1']){
            playerNumber = '2';
            opponentNumber = '1';
          }
          else if (playerSnap['2']){
            playerNumber = '1';
            opponentNumber = '2';
          }

          console.log(screenName+': '+playerNumber + ' Opponent: '+ opponentNumber);
          addUser(playerNumber, obj);
          turnOnChatListener();
          turnOnPlayerListener();
        });
      }
      else{
        alert('Sorry there are already two players playing the game.');
      }
    });
  });

  // Push Objects to Firebase
  function addUser(number, obj) {
    database.ref().child('players').child(number).set(obj);
  }

  // Load options
  function loadRPSoptions() {
    playerOpt.empty();
    createOption('Rock');
    createOption('Paper');
    createOption('Scissor');
  }

  // Create function for RPS options
  function createOption(option) {
    var pTag = $('<p>');
    var aTag = $('<a>');
    aTag.attr('href', '#');
    aTag.attr('id', option)
    aTag.addClass(option);
    aTag.addClass('option');
    aTag.text(option);
    pTag.append(aTag);
    playerOpt.append(pTag);
  }

  // Removes player from database when browser exits
  window.onbeforeunload = function(event) {
    if (screenName != undefined) {
      database.ref().child('players').child(playerNumber).remove();
      database.ref().child('chat').child(playerNumber).remove();
    }
  };

  // Chat listener
  function turnOnChatListener() {

    // Resets Chat History
    database.ref().child('chat').child(opponentNumber).remove();

    // Loads listener
    database.ref('chat').on('value', function(snapshot) {
      var snap = snapshot.val();
      if(snapshot.hasChild(opponentNumber) && lastMsg !== snap[opponentNumber].msg){

        lastMsg = snap[opponentNumber].msg;
        sendMessage(snap[opponentNumber].msg,true,false,'rectangle');
        console.log('im toasting');
      }
    });
  }

  // Player listener
  function turnOnPlayerListener() {
    database.ref('players').on('value', function(snapshot) {
      var snap = snapshot.val();

      if(snapshot.hasChild(opponentNumber) && !opponentLoaded){
        opponentLoaded = true;
        opponentName = snap[opponentNumber].name;
        sendMessage(opponentName + ' has joined the game.', true, false, 'rounded');
        startGame();
      }
      else if (!snapshot.hasChild(opponentNumber)){
        if (opponentName != undefined){
          sendMessage(opponentName + ' has left the game.', true, false, 'rounded');
        }
        database.ref().child('players').child(playerNumber).child('choice').remove();
        console.log('Player 2 not here.');
        player2.text('Player 2');
        updateText('Waiting for a new player.','status');
        updateText('','opponent');
        updateText('','player');
        opponentLoaded = false;
        opponentName = undefined;
        opponentNumber = undefined;
      }
      else if (snapshot.hasChild(opponentNumber) ){
        if (snapshot.child(opponentNumber).hasChild('choice') && opponentDecide === undefined){
          console.log(snap[opponentNumber].choice);
          opponentDecide = snap[opponentNumber].choice;
        }
        if (opponentDecide && playerDecide && !madeDecision){
          madeDecision = true;
          decideWinner();
        }
      }
    });
  }

  // Update Text function
  function updateText(text,element){
    if (element == 'player'){
      var pTag = $('<p>');
      playerOpt.empty();
      pTag.addClass('orange-text');
      pTag.text(text);
      playerOpt.append(pTag);
    }
    else if (element == 'opponent'){
      var pTag = $('<p>');
      player2Card.empty();
      pTag.addClass('orange-text');
      pTag.text(text);
      player2Card.append(pTag);
    }
    else if (element == 'status'){
      status.text(text);
    }
  }

  // startGame function
  function startGame(){
    database.ref().child('players').child(playerNumber).child('choice').remove();
    playerDecide = undefined;
    opponentDecide = undefined;
    madeDecision = false;
    player2.text(opponentName);
    loadRPSoptions();
    updateText('Deciding...','opponent');
    updateText('Waiting on player choices.','status');
  }


  // Choose function
  $('#player-options').on('click','.option',function(){
    if (playerDecide == undefined && opponentName != undefined){
      playerDecide = this.id;
      database.ref().child('players').child(playerNumber).child('choice').set(playerDecide);
      updateText('You choose '+playerDecide+'.','player');
    }
  });

  function decideWinner(){
    console.log(screenName +" chooses "+playerDecide+'.');
    console.log(opponentName + ' chooses '+opponentDecide+'.');
    if (playerDecide ==  opponentDecide){
      tie();
    }
    else if (playerDecide == 'Rock'){
      if (opponentDecide ==  'Scissor'){
        win();
      }
      else{
        lose();
      }
    }
    else if (playerDecide == 'Scissor'){
      if (opponentDecide == 'Rock'){
        lose();
      }
      else{
        win();
      }
    }
    else if (playerDecide == 'Paper'){
      if (opponentDecide == 'Scissor'){
        lose();
      }
      else{
        win();
      }
    }
    updateScore();
    updateText(opponentName + ' chooses '+ opponentDecide + '.','opponent');
    setTimeout(startGame,5000);
  }

  function updateScore(){
    playerScore.text('Wins: '+playerWins+' Losses: '+playerLosses+' Ties: '+playerTies);
    opponentScore.text('Wins: '+opponentWins+' Losses: '+opponentLosses+' Ties: '+opponentTies);
  }

  function win(){
    playerWins++;
    opponentLosses++;
    updateText(screenName + ' Wins!','status');
    console.log(screenName + ' Wins!');
    database.ref().child('players').child(playerNumber).child('wins').set(playerWins);
  }

  function lose(){
    playerLosses++;
    opponentWins++;
    updateText(opponentName + ' Wins!','status');
    console.log(opponentName+ ' Wins!');
    database.ref().child('players').child(playerNumber).child('losses').set(playerLosses);
  }

  function tie(){
    playerTies++;
    opponentTies++;
    updateText('It was a tie.','status');
    console.log('It was a tie.');
    database.ref().child('players').child(playerNumber).child('ties').set(playerTies);
  }

});
