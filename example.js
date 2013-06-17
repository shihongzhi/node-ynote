var qs = require( 'qs' );
var ynote = require( "./ynote.js" );
var express = require( 'express' );
app = express();

var consumer_key = YOUR_CONSUMER_KEY;
var consumer_secret = YOUR_CONSUMER_SECRET;
var access_token = YOUR_ACCESS_TOKEN;
var access_token_secret = YOUR_ACCESS_SECRET;
var token = undefined;
var tokenSecret = undefined;

var ynoteClient = new ynote.ynoteClient( consumer_key, consumer_secret, access_token, access_token_secret );

app.get( '/auth/ynote', function ( req, res ){
  ynoteClient.getRequestToken(
  function ( jsonRes ){
    var jsonRes = JSON.parse( jsonRes );
    token = jsonRes.requestToken;
    tokenSecret = jsonRes.requestTokenSecret;
    //set the query string
    var tmp = qs.stringify({ oauth_token : jsonRes.requestToken, oauth_callback : "http://localhost:8000/callback" })
    res.redirect( jsonRes.authorizeURI + '?' + tmp );
  }
  );
});
app.get( '/callback', function ( req, res ){
  ynoteClient.getAccessToken( token, tokenSecret, req.query.oauth_verifier, function ( jsonRes ){
    var jsonRes = JSON.parse( jsonRes );
    res.send( "worked. nice onedd." );
    //test to get user's infomation
    ynoteClient.getUserInfo(
    function ( success, body ){
      console.log( success );
      console.log( body );
    }
    );
  });
});
app.listen( 8000 );
console.log( 'Listening on port 8000' );;