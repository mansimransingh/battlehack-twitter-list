var request = require('request'),
    cheerio = require('cheerio'),
    twitter = require('ntwitter'),    
    async = require('async'),
    bhackURL = "https://2014.battlehack.org/london#",
    bhackTwitterListID = 166091354,
    config = require('./config');

var twit = new twitter({
  consumer_key: config.consumer_key,
  consumer_secret: config.consumer_secret,
  access_token_key: config.access_token_key,
  access_token_secret: config.access_token_secret,
});

var split = function(a, n) {
    var len = a.length,out = [], i = 0;
    while (i < len) {
        var size = Math.ceil((len - i) / n--);
        out.push(a.slice(i, i += size));
    }
    return out;
}

request(bhackURL, function(error, response, html){
  if(!error){
      var twitter_names = [];
      var $ = cheerio.load(html);
      $('.team-member .twitter-link-sm').each(function(i,v){
          twitter_names.push(
              $(v).children('a')
                .first()
                .attr('href')
                .replace(new RegExp('https?:\/\/twitter.com\/'), ''));
      });  
      //twitter only allows max 100 users to be added per request so we split them
      var twitter_names = split(twitter_names, Math.ceil(twitter_names.length/100));
      var requests = [];

      var iteration = function(row,callbackDone) {
        doFind({data: row}, function (err,entry) {
          if(entry.length) {
            callbackDone(); 
            return console.log( 'id=' + entry.id + ' already exists');
          }
          var newEntry = new light(row);
          newEntry.save(function (err,doc) {
            console.log( 'id=' + entry.id + ' saved');
            callbackDone();
          });
        });
      };

      async.eachSeries(
        twitter_names, 
        function(names, callbackDone){
          var names = names.join(',');
          twit.post('/lists/members/create_all.json', {list_id:bhackTwitterListID, screen_name:names}, 
              function(err, body){
                if(err) callbackDone(err);

                callbackDone();
          });
        }, 
        function (err) {
          if(err) console.log(err);

          console.log('Finished');
        }
      );
  }
});
