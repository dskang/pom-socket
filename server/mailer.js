var nodemailer = require('nodemailer');

// create reusable transport method (opens pool of SMTP connections)
var smtpTransport = nodemailer.createTransport("SMTP", {
  service: "Gmail",
  auth: {
    user: "tigersanon@gmail.com",
    pass: "originblack"
  }
});

var timeString = function(seconds) {
  var timeUnits = {
    hour: 3600,
    minute: 60
  };

  var hours = Math.floor(seconds / timeUnits.hour);
  seconds %= timeUnits.hour;
  var minutes = Math.floor(seconds / timeUnits.minute);
  seconds %= timeUnits.minute;

  var hourText = (hours > 1) ? 'hours' : 'hour';
  var minuteText = (minutes > 1) ? 'minutes' : 'minute';
  var secondText = (seconds > 1) ? 'seconds' : 'second';

  var text;
  if (hours > 0) {
    text = hours + ' ' + hourText;
    if (minutes > 0) text += ' and ' + minutes + ' ' + minuteText;
  } else if (minutes > 0) {
    text = minutes + ' ' + minuteText;
    if (seconds > 0) text += ' and ' + seconds + ' ' + secondText;
  } else {
    text = seconds + ' ' + secondText;
  }
  return text;
};

var formatDate = function(d) {
  var date = [
    (d.getMonth() + 1),
    d.getDate(),
    d.getFullYear().toString().substring(2, 4)
  ].join('/');
  var time = [
    (d.getHours() < 10 ? '0' + d.getHours() : d.getHours()),
    (d.getMinutes() < 10 ? '0' + d.getMinutes() : d.getMinutes()),
    (d.getSeconds() < 10 ? '0' + d.getSeconds() : d.getSeconds()),
  ].join(':');
  return date + ' ' + time;
};

var formatConversation = function(conversation) {
  var log = [];
  for (var i = 0; i < conversation.chatLog.length; i++) {
    var message = conversation.chatLog[i];
    log.push('[' + formatDate(message.date) + '] ' + message.user + ': ' + message.text);
  }
  return log.join('\n');
};

var formatConversationMetadata = function(conversation) {
  var data = [
    'User 1: ' + conversation.user1.id + ' (' + conversation.user1.pseudonym + ')',
    'User 2: ' + conversation.user2.id + ' (' + conversation.user2.pseudonym + ')',
    'Question: ' + conversation.question,
    'Start time: ' + formatDate(conversation.startTime),
    'End time: ' + formatDate(conversation.endTime),
    'Length: ' + timeString(Math.floor((conversation.endTime - conversation.startTime) / 1000)),
    'Button displayed: ' + (conversation.buttonDisplayed ? 'Yes' : 'No'),
    'User 1 clicked: ' + (conversation.user1.buttonClicked ? 'Yes' : 'No'),
    'User 2 clicked: ' + (conversation.user2.buttonClicked ? 'Yes' : 'No'),
    'User 1 messages sent: ' + conversation.user1.messagesSent,
    'User 2 messages sent: ' + conversation.user2.messagesSent
  ];
  return data.join('\n');
};

exports.sendMail = function(conversation) {
  var email = {
    from: "TigersAnonymous <tigersanon@gmail.com>",
    to: "tigersanon@gmail.com",
    subject: "Conversation Log - " + conversation.startTime.toString(),
    text: formatConversation(conversation) + '\n\n--\n\n' + formatConversationMetadata(conversation)
  };

  smtpTransport.sendMail(email, function(error, response) {
    if (error) console.log(error);
    else console.log("Message sent: " + response.message);
  });
};
