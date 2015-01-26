/**
 * Created by jerrylinew on 1/14/15.
 */

var express = require('express');
var app = express();
var port = process.env.PORT || 8080;
var io = require('socket.io').listen(app.listen(port));
app.use(express.static('public'));

var clients = [];
var players = [];
var names = [];
var currentTeam = [];
var yesVote = [];
var noVote = [];
var missionVotes = [];
var missionResults = [];
var voteCounter = 0;
var timesRejected = 0;
var merlin;
var assassin;

var missionSizes = [
    [2,3,2,3,3],
    [2,3,4,3,4],
    [2,3,3,4,4],
    [3,4,4,5,5],
    [3,4,4,5,5],
    [3,4,4,5,5]
];

var currentMissionSizes;
var missionNumber;
var currentLeader;

var teamSizes = [
    {res: 3, spy: 2},
    {res: 4, spy: 2},
    {res: 4, spy: 3},
    {res: 5, spy: 3},
    {res: 6, spy: 3},
    {res: 6, spy: 4}
];

io.on('connection', function(client){
    console.log('Client connected!');
    io.set('heartbeat interval', 3);

    //--------------------------- Chatroom ----------------------------------

    client.on('join', function(name){
        for(var i = 0; i < clients.length; i++) {
            if(clients[i].nickname === name) {
                client.emit('duplicate');
                return;
            }
        }
        client.emit('clearscreen');
        client.nickname = name;
        clients.push(client);
        client.emit('otherjoin', name);
        client.broadcast.emit('otherjoin', name);

        for(var i = 0; i < players.length; i++){
            client.emit('joingame', players[i].nickname, i + 1);
        }
    });

    client.on('disconnect', function(){
        client.broadcast.emit('userdisconnect', client.nickname);
        var index = clients.indexOf(client);
        clients.splice(index, 1);

        var playerIndex = players.indexOf(client);
        if(playerIndex != -1){
            client.emit('leavegame', client.nickname);
            client.broadcast.emit('leavegame', client.nickname);
            players.splice(playerIndex, 1);
        }
    });

    client.on('message', function(message){
        client.broadcast.emit("messages", client.nickname, message);
        client.emit("messages", client.nickname, message);
    });

    //------------------------------ Join/Leave Game ------------------------------

    client.on('joingame', function(){
        if(players.indexOf(client) == -1 && players.length <= 10) {
            players.push(client);
            client.broadcast.emit('joingame', client.nickname);
            client.emit('joingame', client.nickname);
        }
    });

    client.on('leavegame', function(){
        var playerIndex = players.indexOf(client);
        if(playerIndex != -1){
            client.emit('leavegame', client.nickname);
            client.broadcast.emit('leavegame', client.nickname);
            players.splice(playerIndex, 1);
        }
    });

    client.on('startgame', function(){
        if(players.length < 5) {
            client.emit('startgame', false);
            return;
        }

        currentMissionSizes = missionSizes[players.length - 5];
        missionNumber = 1;
        shuffle(players);
        players[0].merlin = true;
        merlin = players[0];
        assassin = players[players.length - 1];

        for(var i = 0; i < players.length; i++){
            if(i < teamSizes[players.length - 5].res)
                players[i].team = "res";
            else
                players[i].team = "spy";
        }

        shuffle(players);

        for(var i = 0; i < players.length; i++){
            names.push({name: players[i].nickname, team: players[i].team});
        }

        currentLeader = players[0];
        client.emit('startgame', true, names, currentLeader.nickname, currentMissionSizes);
        client.broadcast.emit('startgame', true, names, currentLeader.nickname, currentMissionSizes);

        currentLeader.emit('chooseTeam', currentMissionSizes[missionNumber - 1]);

        for(var i = 0; i < players.length; i++){
            if(players[i].team === "spy") {
                players[i].emit('spySetup');
            }
            else if(players[i].merlin === true) {
                players[i].emit('merlinSetup', players[i].nickname)
            }
            else{
                players[i].emit('resistanceSetup');
            }
        }
    });

    client.on('proposedTeam', function(chosenMembers){
        currentTeam = [];
        yesVote = [];
        noVote = [];
        voteCounter = 0;

        for(var i = 0; i < chosenMembers.length; i++){
            for(var j = 0; j < players.length; j++){
                if(chosenMembers[i] === players[j].nickname){
                    currentTeam.push(players[j]);
                    break;
                }
            }
        }

        for(var i = 0; i < players.length; i++){
            players[i].emit('proposedTeam', chosenMembers);
        }
    });

    client.on('vote', function(vote){
        voteCounter++;

        if(vote === 'yes'){
            yesVote.push(client.nickname);
        }
        else if(vote === 'no'){
            noVote.push(client.nickname);
        }

        if(voteCounter === players.length){
            var currentTeamNames = [];

            for(var i = 0; i < currentTeam.length; i++){
                currentTeamNames.push(currentTeam[i].nickname);
            }

            for(var i = 0; i < players.length; i++) {
                players[i].emit('donevote', yesVote, noVote, missionNumber, timesRejected, currentTeamNames, players[0].nickname);
            }

            if(yesVote.length > noVote.length){
                timesRejected = 0;
                missionVotes = [];
                for(var i = 0; i < players.length; i++){
                    if(currentTeam.indexOf(players[i]) == -1){
                        players[i].emit('offmission');
                    }
                    else{
                        players[i].emit('onmission', players[i].team);
                    }
                }
            }
            else{
                timesRejected++;
                if(timesRejected == 5){
                    for(var i = 0; i < players.length; i++){
                        players[i].emit('spyvictory', names, merlin.nickname);
                    }
                }
                else{
                    getLeader(players);
                    for(var i = 0; i < players.length; i++){
                        players[i].emit('newleader', players[0].nickname, timesRejected, missionNumber);
                    }
                    players[0].emit('chooseTeam', currentMissionSizes[missionNumber - 1]);
                }
            }
        }
    });

    client.on('missionvote', function(choice){
        missionVotes.push(choice);
        var failCounter = 0;

        if(missionVotes.length === currentTeam.length){
            for(var i = 0; i < missionVotes.length; i++){
                if(missionVotes[i] === "fail") {
                    failCounter++;
                }
            }

            if(players.length >= 7 && missionNumber === 4){
                if(failCounter >= 2){
                    missionResults.push("fail");
                    for(var i = 0; i < players.length; i++){
                        players[i].emit('donemission', missionVotes, missionResults, missionNumber);
                    }
                }
                else{
                    missionResults.push("success");
                    for(var i = 0; i < players.length; i++){
                        players[i].emit('donemission', missionVotes, missionResults, missionNumber);
                    }
                }
            }
            else{
                if(failCounter >= 1){
                    missionResults.push("fail");
                    for(var i = 0; i < players.length; i++){
                        players[i].emit('donemission', missionVotes, missionResults, missionNumber);
                    }
                }
                else{
                    missionResults.push("success");
                    for(var i = 0; i < players.length; i++){
                        players[i].emit('donemission', missionVotes, missionResults, missionNumber);
                    }
                }
            }

            setTimeout(function(){
                var numMissionFail = 0;
                var numMissionSuccess = 0;

                for(var i = 0; i < missionResults.length; i++){
                    if(missionResults[i] === "fail"){
                        numMissionFail++;
                    }
                    else{
                        numMissionSuccess++;
                    }
                }

                if(numMissionFail === 3){
                    for(var i = 0; i < players.length; i++){
                        players[i].emit('spyvictory', names, merlin.nickname);
                    }
                }
                else if(numMissionSuccess === 3){
                    for(var i = 0; i < players.length; i++){
                        players[i].emit('waitforassassin', assassin.nickname, names, merlin.nickname);
                    }
                    assassin.emit('killmerlin');
                }
                else{
                    missionNumber++;
                    getLeader(players);
                    for(var i = 0; i < players.length; i++){
                        players[i].emit('newleader', players[0].nickname, timesRejected, missionNumber);
                    }
                    players[0].emit('chooseTeam', currentMissionSizes[missionNumber - 1]);
                }
            }, (missionVotes.length + 8) * 1000);
        }
    });

    client.on('killmerlin', function(target){
        if(merlin.nickname !== target){
            for(var i = 0; i < players.length; i++){
                players[i].emit('resistancevictory', target, merlin.nickname);
            }
        }
        else{
            for(var i = 0; i < players.length; i++){
                players[i].emit('spyassassinatevictory', target, merlin.nickname);
            }
        }
    });

    function shuffle(array) {
        var currentIndex = array.length, temporaryValue, randomIndex;

        // While there remain elements to shuffle...
        while (0 !== currentIndex) {
            // Pick a remaining element...
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex -= 1;

            // And swap it with the current element.
            temporaryValue = array[currentIndex];
            array[currentIndex] = array[randomIndex];
            array[randomIndex] = temporaryValue;
        }

        return array;
    }

    function getLeader(array){
        if(array.length === 0)
            return;

        var temp = array[0];

        for(var i = 1; i < array.length; i++){
            array[i - 1] = array[i];
        }

        array[array.length - 1] = temp;
        return array[0];
    }
});