var questions = require('./questions').list;

// Used in lieu of positive and negative infinity
var largePositiveNumber = 1000000000;
var largeNegativeNumber = -1000000000;

// UCB1 function to pick opening question
exports.getQuestion = function(collection, user1, user2, callback) {
  var questionAsked = {
    $or: [
      {$eq: ["$userID1", user1.id]}, 
      {$eq: ["$userID2", user1.id]}, 
      {$eq: ["$userID1", user2.id]}, 
      {$eq: ["$userID2", user2.id]}
    ]
  };

  var outputFormat = {
    _id: "$question",
    plays: {$sum: 1},
    wins: {$sum: {$cond: [{$and: ["$user1Clicked", "$user2Clicked"]}, 1, 0]}},
    timesShown: {$sum: {$cond: [questionAsked, 1, 0]}}
  };

  // Aggregate conversation data and call UCB callback
  collection.aggregate().group(outputFormat).exec(function(err, data) {
    if (err) console.log(err);
    UCB1(data, callback);
  });
}

// Helper function to get a random question
var getRandomQuestion = function() {
  var randomIndex = Math.floor(Math.random() * questions.length);
  return questions[randomIndex];
};

// Helper function to invoke callback on the data item with the max UCB value
var UCB1 = function(data, callback) {
  var finalData = {};

  // If there's no data, return a random question
  if (data.length === 0) {
    callback(getRandomQuestion());
    return;
  } else {
    // Otherwise, get all the available data for the questions and run UCB
    var questionStats = {};
    var totalPlays = 0;

    // For each entry in data, sum the total number of plays and
    // populate the questionStats table with the corresponding question
    for (var i = 0; i < data.length; i++) {
      var entry = data[i];
      questionStats[entry._id] = {
        plays: entry.plays,
        wins: entry.wins,
        shown: (entry.timesShown > 0 ? true : false)
      };
      totalPlays += entry.plays;
    }

    for (var i = 0; i < questions.length; i++) {
      var question = questions[i];
      // If there's no data for this question, then it hasn't been
      // displayed yet, so assign it an arbitrarily large UCB value
      if (!questionStats[question]) {
        finalData[question] = largePositiveNumber;
      } else if (questionStats[question].shown) {
        continue;
      } else {
        // If the question hasn't been shown and there's data for it,
        // compute the UCB value
        var probabilityEstimate =
          questionStats[question].wins / questionStats[question].plays;
        var UCBoundEstimate =
          Math.sqrt(2 * Math.log(totalPlays / questionStats[question].plays));
        finalData[question] = probabilityEstimate + UCBoundEstimate;
      }
    }

    if (Object.keys(finalData).length > 0) {
      // Find question with max UCB value
      var bestValue = largeNegativeNumber;
      var bestMatch = null;
      for (var question in finalData) {
        var currentValue = finalData[question];
        if (currentValue >= bestValue) {
          bestMatch = question;
          bestValue = currentValue;
        }
      }
      callback(bestMatch);
    } else {
      callback(getRandomQuestion());
    }
  }
};
