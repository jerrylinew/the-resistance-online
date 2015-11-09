/**
 * Created by jerrylinew on 1/14/15.
 */

var $actions = $('#actions');
var players;

$actions.on('click', '#joinButton', function(e){
    e.preventDefault();
    server.emit('joingame');
});
server.on('joingame', function(nickname){
    var newPlayer = $('<li id="player' + nickname + '">' + nickname + '</li>')
    $('#playerList').append(newPlayer);
    $('#player' + nickname).hide().fadeIn(500);
});

$actions.on('click', '#leaveButton', function(e){
    e.preventDefault();
    server.emit('leavegame');
});
server.on('leavegame', function(nickname){
    $('#player' + nickname).fadeOut(500, function(){
        $(this).remove();
    });
});

$actions.on('click', '#startButton', function(e){
    e.preventDefault();
    server.emit('startgame')
});
server.on('startgame', function(error, names, leader, missionSizes){
    if(error === false) {
        swal("Game must have at least 5 players to begin.");
        return;
    }

    $('#startButton').fadeOut(500, function(){
        $(this).hide();
    });

    $('#joinButton').fadeOut(500, function(){
        $(this).hide();
    });

    $('#leaveButton').fadeOut(500, function(){
        $(this).hide();
    });

    $('#currentLeader').text("Current Leader: " + leader).hide().fadeIn(500);
    $('#instructions').text("Waiting for "+ leader + " to propose a team...");
    $('#missionNumber').text("Mission 1").hide().fadeIn(500);
    $('#consecRejects').text("Consecutive Rejections: 0").hide().fadeIn(500);
    $('#mission1').addClass('currentMission');
    var leaderOrder = $('#leaderOrderList');
    leaderOrder.append('<h3>Leader Order</h3>');

    for(var i = 0; i < names.length; i++){
        leaderOrder.append('<li>' + names[i].name + '</li>');
    }

    for(var i = 0; i < 5; i++){
        $('#mission' + (i + 1)).find('p').text(missionSizes[i]);
    }

    players = names;
});

server.on('spySetup', function(){
    for(var i = 0; i < players.length; i++) {
        $('#player' + players[i].name).addClass(players[i].team);
    }

    $('#team').hide().text("You are a spy. The players in red are spies.").fadeIn(500);
});

server.on('merlinSetup', function(merlin){
    for(var i = 0; i < players.length; i++) {
        $('#player' + players[i].name).addClass(players[i].team);
    }

    $('#team').hide().text("You are the Merlin. The players in red are spies.").fadeIn(500);
    $('#player' + merlin).removeClass('res').addClass('merlin');
});

server.on('resistanceSetup', function(){
   $('#team').hide().text("You are part of the Resistance.").fadeIn(500);
});