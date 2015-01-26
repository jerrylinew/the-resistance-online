/**
 * Created by jerrylinew on 1/18/15.
 */

var server = io.connect('https://theresistanceonline.herokuapp.com/');

var username;

function userconnect(){
    var nickname = null;
    while(nickname == null || nickname == '') {
        nickname = prompt("Pick a username:");
        if(nickname == null || nickname == '')
            continue;
        if(nickname.length >= 10) {
            alert('Name is too long, please enter another username.');
            nickname = '';
            continue;
        }
        if(nickname.indexOf(' ') != -1){
            alert('Please enter a username without a space.');
            nickname = '';
        }
    }
    username = nickname;
    server.emit('join', nickname);
}

server.on('connect', userconnect);

server.on('duplicate', function(){
    alert('That username has already been taken, please enter another username.');
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