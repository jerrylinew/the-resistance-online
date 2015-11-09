/**
 * Created by jerrylinew on 1/22/15.
 */

server.on('chooseTeam', function(numTeamMembers){
    $('#instructions').text("Pick " + numTeamMembers + " people to go on the mission.");
    var chosen = [];

    $('#greenButton').text('Confirm').on('click', function(e){
        if(chosen.length !== numTeamMembers){
            swal("Please choose exactly " + numTeamMembers + " people to go on the mission.");
            return;
        }

        server.emit('proposedTeam', chosen);
        $(this).off();
        $('#redButton').off();
        $('#actions').off('click', '#playerList li');
        $('#gameButtons').fadeOut(500);
    });

    $('#redButton').text('Reset').on('click', function(e){
        $('#playerList').find('.selected').removeClass('selected');
        chosen = [];
    });

    $('#gameButtons').delay(500).fadeIn(500);

    $('#actions').on('click', '#playerList li', function(e){
        var target = $(this);
        if(target.hasClass('selected')) {
            target.removeClass('selected');
            chosen.splice(chosen.indexOf(target.text()), 1);
        }
        else{
            target.addClass('selected');
            chosen.push(target.text());
        }
    });
});

server.on('proposedTeam', function(chosenMembers){
    for(var i = 0; i < chosenMembers.length; i++){
        $('#player' + chosenMembers[i]).addClass('selected');
    }

    var instructions = $('#instructions');
    instructions.text('The proposed team is shown above. Approve or reject this proposal?');

    $('#greenButton').text('Approve').on('click', function(e){
        instructions.text("You have approved this mission proposal. Waiting for everyone to finish voting.");
        $('#gameButtons').fadeOut(500);
        server.emit('vote', 'yes');
    });

    $('#redButton').text('Reject').on('click', function(e){
        instructions.text("You have rejected this mission proposal. Waiting for everyone to finish voting.");
        $('#gameButtons').fadeOut(500);
        server.emit('vote', 'no');
    });

    $('#gameButtons').fadeIn(500);
});

server.on('donevote', function(yesVote, noVote, missionNumber, numRejects, proposedTeam, currentLeader){
    $('#greenButton').off();
    $('#redButton').off();
    var yesVoteP = '<p id="approved">Approved: ';
    var noVoteP = '<p id="rejected">Rejected: ';

    for(var i = 0; i < yesVote.length - 1; i++){
        yesVoteP += yesVote[i] + ', ';
    }
    if(yesVote.length !== 0)
        yesVoteP += yesVote[yesVote.length - 1] + '</p>';

    for(var i = 0; i < noVote.length - 1; i++){
        noVoteP += noVote[i] + ', ';
    }
    if(noVote.length !== 0)
        noVoteP += noVote[noVote.length - 1] + '</p>';

    var voteResults = $('#votingResults');
    var title = $('<h3></br></br>Mission ' + missionNumber + ' Voting Results (' + (numRejects + 1) + ')</h3>');
    voteResults.append(title);
    var temp = '<p>Proposed team: ';

    for(var i = 0; i < proposedTeam.length - 1; i++) {
        temp += proposedTeam[i] + ', ';
    }
    temp += proposedTeam[proposedTeam.length - 1] + '</p>';

    voteResults.append($('<p>Leader: ' + currentLeader + '<p/>')).append($(temp)).append($(yesVoteP)).append($(noVoteP));

    if(yesVote.length > noVote.length){
        voteResults.append($('<p>The mission has been approved.</p>'));
    }
    else{
        voteResults.append($('<p>The mission has been rejected.</p>'));
        $('.selected').removeClass('selected');
    }

    voteResults.scrollTop(voteResults[0].scrollHeight);
});

server.on('onmission', function(team){
    var successButton = $('#success');
    var failButton = $('#fail');
    var bothButtons = $('#successFail');
    var instructions = $('#instructions');
    instructions.text("You are currently on the mission; will you succeed or fail it?");
    bothButtons.delay(500).fadeIn(500);

    successButton.on('click', function(){
        successButton.off();
        failButton.off();
        instructions.text('You have chosen to succeed this mission. Waiting for others to decide...');
        bothButtons.fadeOut(500);
        server.emit('missionvote', "success");
    });

    failButton.on('click', function(){
        if(team === 'res'){
            instructions.text('As part of the Resistance, you cannot fail the mission. Please choose again.');
            return;
        }
        successButton.off();
        failButton.off();
        instructions.text('You have chosen to fail this mission. Waiting for others to decide...');
        bothButtons.fadeOut(500);
        server.emit('missionvote', "fail");
    });
});

server.on('offmission', function(){
    $('#instructions').text("The mission has been approved. Waiting for mission results...");
});

server.on('donemission', function(missionVotes, missionResults, missionNumber){
    var numFail = 0;

    for(var i = 0; i < missionVotes.length; i++){
        if(missionVotes[i] === "fail"){
            numFail++;
        }
    }
    var numSuccess = missionVotes.length - numFail;

    var $missionResults = $('#missionResults');
    $missionResults.append('<h3>Mission ' + missionNumber + ' Results</h3>').append('<div id="results"></div>').delay(501).fadeIn(1000);
    var results = $('#results');

    for(var i = 0; i < numSuccess; i++){
        results.append('<img class="result" src="images/success.png"/>');
    }
    for(var i = 0; i < numFail; i++){
        results.append('<img class="result" src="images/fail.png"/>');
    }

    var index = 0;

    $('.result').each(function(){
        $(this).delay(1000 * (index + 2)).fadeIn(1000);
        index++;
    });

    setTimeout(function(){
        var $curMission = $('#mission' + missionNumber);
        $curMission.removeClass('currentMission');
        $('.selected').removeClass('selected');
        if(missionResults[missionNumber - 1] === "success"){
            $curMission.addClass('missionSuccess');
            $('#instructions').text("The mission has succeeded!");
        }
        else{
            $curMission.addClass('missionFailure');
            $('#instructions').text("The mission has failed...")
        }
        if(missionNumber !== 5){
            $('#mission' + (missionNumber + 1)).addClass('currentMission');
        }
    }, (missionVotes.length + 2) * 1000);

    setTimeout(function(){
        $missionResults.fadeOut(700).empty();
    }, (missionVotes.length + 7) * 1000);
});

server.on('newleader', function(leader, timesRejected, missionNumber){
    $('#missionNumber').text("Mission " + missionNumber);
    $('#currentLeader').text("Current Leader: " + leader);
    $('#consecRejects').text("Consecutive Rejections: " + timesRejected);
    $('#instructions').text("Waiting for "+ leader + " to propose a team...");
});

server.on('waitforassassin', function(assassin, names){
    $('#instructions').text("The Resistance have succeeded three missions, but the Merlin can still be killed. Waiting" +
    " for the assassin, " + assassin + ", to choose someone to kill...");

    for(var i = 0; i < names.length; i++){
        $('#player' + names[i].name).addClass(players[i].team);
    }
});

server.on('killmerlin', function(){
    $('#instructions').text("Pick someone to assassinate. If you kill the Merlin, the spies will win the game.");
    var killTarget;

    $('#greenButton').text('Confirm').on('click', function(e){
        if(killTarget !== null){
            server.emit('killmerlin', killTarget);
            $(this).off();
            $('#actions').off('click', '#playerList li');
            $('#gameButtons').fadeOut(500);
        }
    });

    $('#redButton').hide();

    $('#gameButtons').delay(500).fadeIn(500);

    $('#actions').on('click', '#playerList li', function(e){
        var target = $(this);
        $('.selected').removeClass('selected');
        target.addClass('selected');
        killTarget = target.text();
    });
});

server.on('resistancevictory', function(target, merlin){
    $('#instructions').text('The spies tried to assassinate ' + target + ', who was NOT the Merlin. ' +
    'The Resistance wins the game!');

    $('#player' + target).addClass('selected');

    $('#player' + merlin).removeClass('res').addClass('merlin');
});

server.on('spyvictory', function(names, merlin){
    $('#instructions').text('The spies win the game!');

    for(var i = 0; i < names.length; i++){
        $('#player' + names[i].name).addClass(players[i].team);
    }
    $('#player' + merlin).removeClass('res').addClass('merlin');
});

server.on('spyassassinatevictory', function(target, merlin){
    $('#instructions').text('The spies assassinated ' + target + ', who was indeed the Merlin. ' +
    'The spies win the game!');

    $('#player' + merlin).removeClass('res').addClass('merlin').addClass('selected');
});