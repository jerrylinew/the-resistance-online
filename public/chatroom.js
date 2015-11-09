/**
 * Created by jerrylinew on 1/18/15.
 */

var server = io.connect('https://theresistanceonline.herokuapp.com/');


var username;

function userconnect(){
    var nickname = null;

    swal({
        title: "Welcome to <em>The Resistance</em>!",
        text: 'The Empire must fall. Our mission must succeed. By destroying their key bases, we will shatter ' +
        'Imperial strength and liberate our people. Yet spies have infiltrated our ranks, ready for sabotage. ' +
        'We must unmask them. In five nights we reshape destiny or die trying. We are the Resistance! </br>' +
        '</br> Please enter your username:',
        type: 'input',
        showCancelButton: false,
        closeOnConfirm: false,
        html: true,
        animation: "slide-from-top"
    }, function(inputValue){
        nickname = inputValue;
        if(nickname == null || nickname == ''){
            swal.showInputError("Your username cannot be empty!");
            return false;
        }
        else if(nickname.length >= 10) {
            swal.showInputError("Your username is too long, please choose a shorter one.");
            return false;
        }
        else if(nickname.indexOf(' ') != -1){
            swal.showInputError('Please enter a username without a space.');
            return false;
        }
        else {
            username = nickname;

            swal({
                title: 'Good luck on your missions!',
                text: 'If you do not know the rules to <em>The Resistance: Avalon</em>, please visit this link: <a target="_blank" href="http://www.redmeeple.com/site/images/Rules/The_Resistance_Avalon_Rules(EN).pdf">Rulebook</a> (only the Merlin and Assassin roles will be used)',
                confirmButtonText: 'Join Game',
                html: true
            }, function(){
                server.emit('join', username);
                server.emit('joingame');
                $('#game').fadeIn(1500);
            });

        }
    });

}

server.on('connect', userconnect);

server.on('duplicate', function(){
    swal('That username has already been taken, please enter another username.');
    userconnect();
});

server.on('clearscreen', function(){
    $('#chatlog').empty();
});

server.on('userdisconnect', function(username){
    var newMessage = $('<p></p>');
    newMessage.append('<span id=newuser>' + username + ' has left the chatroom.' + '</span>');
    var chatlog = $('#chatlog');
    chatlog.append(newMessage);
    chatlog.scrollTop(chatlog[0].scrollHeight);
});

server.on('otherjoin', function(username){
    var newMessage = $('<p></p>');
    newMessage.append('<span id=newuser>' + username + ' has joined the chatroom.' + '</span>');
    var chatlog = $('#chatlog');
    chatlog.append(newMessage);
    chatlog.scrollTop(chatlog[0].scrollHeight);
});

server.on('messages', function(username, message){
    var newMessage = $('<p></p>');
    newMessage.append('<span class=username>' + username + ':</span>');
    newMessage.append(message);
    var chatlog = $('#chatlog');
    chatlog.append(newMessage);
    chatlog.scrollTop(chatlog[0].scrollHeight);
});

$('#form').on('submit', function(e){
    e.preventDefault();
    var messageEl = $('#message');
    var message = messageEl.val();
    messageEl.val('');

    if(message === '')
        return;

    server.emit('message', message);
});