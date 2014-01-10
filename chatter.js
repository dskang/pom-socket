var queue = require('./queue.js'),
    convo = require('./conversation.js');

// FIXME: make this larger than 0
var threshold = 0;
var userName = 'You';
var partnerName = 'Anonymous Tiger';

function User(socket, userID) {
  this.socket = socket;
  this.id = userID;
  this.partner = null;
  this.conversation = null;
  this.buttonClicked = false;
  this.messagesSent = 0;

  this.socket.emit('entrance', {
    message: 'Welcome to the chat room!'
  });

  var user = this;
  this.socket.on('disconnect', function() {
    if (!user.conversation) return;

    if (!user.conversation.endTime) {
      user.conversation.endTime = Date.now();
      convo.save(user.conversation);

      user.partner.socket.emit('exit', {
        message: partnerName + ' has disconnected. Refresh the page to start another chat!'
      });
    }
  });

  this.socket.on('chat', function(data) {
    if (!user.conversation) return;

    user.messagesSent++;
    user.socket.emit('chat', {
      message: userName + ': ' + data.message
    });
    user.partner.socket.emit('chat', {
      message: partnerName + ': ' + data.message
    });
  });

  this.socket.on('reveal-button', function(data) {
    user.conversation.buttonDisplayed = true;
  });
}

function Conversation(user1, user2) {
    this.user1 = user1,
    this.user2 = user2,
    this.startTime = Date.now(),
    this.endTime = null,
    this.matchingHeuristic = null,
    this.buttonDisplayed = false
}

exports.connectChatter = function(socket, userID) {

  var user = new User(socket, userID);

  if (queue.length() <= threshold) {
    queue.addUser(user);
    user.socket.emit('waiting', {
      message: 'Waiting for partner to join.'
    });

    // FIXME: remove handler after user is taken off queue
    user.socket.on('disconnect', function() {
      queue.removeUser(user);
    });

  } else {
    // Match user with partner
    partner = queue.getPartner(user);
    user.partner = partner;
    partner.partner = user;

    // Create conversation
    var conversation = new Conversation(user, partner);
    user.conversation = conversation;
    partner.conversation = conversation;

    // Notify users that they are connected
    var connectedMessage = {
      message: 'Connected! Go ahead and start chatting.'
    };
    user.socket.emit('ready', connectedMessage);
    partner.socket.emit('ready', connectedMessage);
  }
};
