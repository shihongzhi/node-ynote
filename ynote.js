var OAuth = require('oauth').OAuth;
var request = require('request');
var fs = require('fs');
var path = require("path");
var mime = require("mime");
var baseurl = "http://note.youdao.com";

var ynoteClient = exports.ynoteClient = function(consumer_key, consumer_secret, access_token, access_token_secret, options) {
    options = options || {};
    this.consumer_key = consumer_key;
    this.consumer_secret = consumer_secret;
    this.access_token = access_token || undefined;
    this.access_token_secret = access_token_secret || undefined;
    
    this.oauthkey = {
        consumer_key: this.consumer_key,
        consumer_secret: this.consumer_secret,
        token: this.access_token,
        token_secret: this.access_token_secret
    };
};

ynoteClient.prototype.getRequestToken = function(cb) {
    this.oa = new OAuth(
            baseurl + "/oauth/request_token",
            baseurl + "/oauth/access_token",
            this.consumer_key,
            this.consumer_secret,
            "1.0",
            null,
            "HMAC-SHA1"
        );
    var self = this;
    this.oa.getOAuthRequestToken(function(error, oauth_token, oauth_token_secret, results){
            self.token = oauth_token;
            self.token_secret = oauth_token_secret

            var data = {authorizeURI: baseurl + '/oauth/authorize', requestToken: oauth_token, requestTokenSecret: oauth_token_secret};
            var res = (error != undefined) ? JSON.stringify(error) : JSON.stringify(data);
            cb(res);
        });
};

ynoteClient.prototype.getAccessToken = function(token, token_secret, verifier, cb) {
    var self = this;
    this.oa.getOAuthAccessToken(token, token_secret, verifier,
        function(error, oauth_access_token, oauth_access_token_secret, results){
            self.access_token = oauth_access_token;
            self.access_token_secret = oauth_access_token_secret;
            self.oauthkey = {
                consumer_key: self.consumer_key,
                consumer_secret: self.consumer_secret,
                token: self.access_token,
                token_secret: self.access_token_secret
            };

            var data = {accessToken: oauth_access_token, accessTokenSecret: oauth_access_token_secret};
            var res = (error != undefined)? JSON.stringify(error) : JSON.stringify(data);
            cb(res);
        }
    );
};

ynoteClient.prototype.parseStatusCode = function(statusCode) {
    var success = undefined;
    if(statusCode === 500)
        success = false;
    if(statusCode === 200)
        success = true;
    return success;
};

ynoteClient.prototype.getUserInfo = function(cb){
    var self =this;
    request.get({
            "url": baseurl + '/yws/open/user/get.json',
            "oauth": this.oauthkey
        }, function(err, res, body){
            var statusCode = res.statusCode;
            cb(self.parseStatusCode(statusCode), body);
            self.userInfo = JSON.parse(body);
        }
    );
}

ynoteClient.prototype.allNotebook = function(cb){
    var self = this;
    request.post({
            "url": baseurl + '/yws/open/notebook/all.json',
            "oauth": this.oauthkey,
            "headers" : {
                "content-type" : "application/x-www-form-urlencoded"
            },
        }, function(err, res, body){
            var statusCode = res.statusCode;
            cb(self.parseStatusCode(statusCode), body);
        }
    );
};

ynoteClient.prototype.listNotebook = function(notebook, cb){
    var self = this;
    request.post({
            "url": baseurl + '/yws/open/notebook/list.json',
            "oauth": this.oauthkey,
            "headers" : {
                "content-type" : "application/x-www-form-urlencoded"
            },
            form: {"notebook": notebook}
        }, function(err, res, body){
            var statusCode = res.statusCode;
            cb(self.parseStatusCode(statusCode), body);
        }
    );
};

ynoteClient.prototype.createNotebook = function(name, cb){
    var self = this;
    request.post({
            "url": baseurl + '/yws/open/notebook/create.json',
            "oauth": this.oauthkey,
            "headers" : {
                "content-type" : "application/x-www-form-urlencoded"
            },
            form: {"name": name}
        }, function(err, res, body){
            var statusCode = res.statusCode;
            cb(self.parseStatusCode(statusCode), body);
        }
    );
};

ynoteClient.prototype.deleteNotebook = function(notebook, cb){
    var self = this;
    request.post({
            "url": baseurl + '/yws/open/notebook/delete.json',
            "oauth": this.oauthkey,
            "headers" : {
                "content-type" : "application/x-www-form-urlencoded"
            },
            form: {"notebook": notebook}
        }, function(err, res, body){
            var statusCode = res.statusCode;
            cb(self.parseStatusCode(statusCode), body);
        }
    );
};

ynoteClient.prototype.createNote = function (notebook, title, author, source, content, cb) {
    var self = this;
    var multipart_array = [];
    ["notebook", "title", "author", "source", "content"].forEach(function(item){
        if(eval(item)){
            multipart_array.push({
                "Content-Disposition" : 'form-data; name="' + item +'";',
                "Content-type": "text/plain",
                "body": eval(item) 
            });
        }
    });
    request.post({
            "url" : baseurl + '/yws/open/note/create.json',
            "oauth" : this.oauthkey,
            "headers" : {
                "content-type" : "multipart/form-data"
            },
            multipart : multipart_array
        },
        function(err, res, body) {
            var statusCode = res.statusCode;
            cb(self.parseStatusCode(statusCode), body);
        }
    );
};

ynoteClient.prototype.getNote = function (path, cb) {
    var self = this;
    request.post({
            "url": baseurl + '/yws/open/note/get.json',
            "oauth": this.oauthkey,
            "headers" : {
                "content-type" : "application/x-www-form-urlencoded"
            },
            form: {"path": path}
        }, function(err, res, body){
            var statusCode = res.statusCode;
            cb(self.parseStatusCode(statusCode), body);
        }
    );
};

ynoteClient.prototype.updateNote = function(path, source, author, title, content, cb){
    var self = this;
    var multipart_array = [];
    ["path", "source", "author", "title", "content"].forEach(function(item){
        if(eval(item)){
            multipart_array.push({
                "Content-Disposition" : 'form-data; name="' + item +'";',
                "Content-type": "text/plain",
                "body": eval(item) 
            });
        }
    });
    request.post({
            "url" : baseurl + '/yws/open/note/update.json',
            "oauth" : this.oauthkey,
            "headers" : {
                "content-type" : "multipart/form-data"
            },
            multipart : multipart_array
        },
        function(err, res, body) {
            var statusCode = res.statusCode;
            cb(self.parseStatusCode(statusCode), body);
        }
    );
};

ynoteClient.prototype.moveNote = function(path, notebook, cb){
    var self = this;
    request.post({
            "url": baseurl + '/yws/open/note/move.json',
            "oauth": this.oauthkey,
            "headers" : {
                "content-type" : "application/x-www-form-urlencoded"
            },
            form: {
                "path": path, 
                "notebook": notebook
            }
        }, function(err, res, body){
            var statusCode = res.statusCode;
            cb(self.parseStatusCode(statusCode), body);
        }
    );
};

ynoteClient.prototype.deleteNote = function(path, cb){
    var self = this;
    request.post({
            "url": baseurl + '/yws/open/note/delete.json',
            "oauth": this.oauthkey,
            "headers" : {
                "content-type" : "application/x-www-form-urlencoded"
            },
            form: {
                "path": path
            }
        }, function(err, res, body){
            var statusCode = res.statusCode;
            cb(self.parseStatusCode(statusCode), body);
        }
    );
};

ynoteClient.prototype.uploadFile = function(file, cb){
    var self = this;
    var f = fs.readFileSync(file);
    var fb = new Buffer(f, 'binary');
    var basename = path.basename(file);

    request.post({
            "url" : baseurl + '/yws/open/resource/upload.json',
            "oauth" : this.oauthkey,
            "headers" : {
                "content-type" : "multipart/form-data"
            },
            multipart : [{
                "Content-Disposition" : 'form-data; name="file"; filename="' + basename +'"',
                "Content-type": mime.lookup(basename),
                "body": fb}
            ]
        },
        function(err, res, body) {
            var statusCode = res.statusCode;
            cb(self.parseStatusCode(statusCode), body);
        }
    );
};

ynoteClient.prototype.downloadFile = function(link, cb){
    var self = this;
    request.get({
            "url": link,
            "oauth": this.oauthkey,
        }, function(err, res, body){
            var statusCode = res.statusCode;
            cb(self.parseStatusCode(statusCode), body);
        }
    );
};