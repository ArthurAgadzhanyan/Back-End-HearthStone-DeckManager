const HTTP = require("http");
const MONGOCLIENT = require("mongodb").MongoClient;
const jwt = require('jsonwebtoken');
const unirest = require("unirest");
const SECRET_KEY = "QsafQAWRIOjh1";



HTTP.createServer(function(request, response){
    const CLIENT = new MONGOCLIENT("mongodb://localhost:27017/", { useNewUrlParser: true });

    if(request.method === 'OPTIONS'){response.end()}
    if(request.url === "/register" && request.method === 'POST'){
        var body = '';
         request.on('data', function (chunk) {
            body += chunk.toString('utf8');
        }).on('end', function () {
             var data = JSON.parse(body);
             CLIENT.connect(function(err, CLIENT){ 
                 const db = CLIENT.db("node");
                 const collection = db.collection("user");
                 let user = {login: data.login, password: data.password};
                 collection.insertOne(user, function(err, result){
                     if(err){
                         return console.log(err);
                     }
                     console.log(result.ops);
                     CLIENT.close();
                 });
             });
             response.end();
        });
    }
    if(request.url == "/authorization" && request.method == "POST"){
        var authBody = '';
        request.on('data', function (chunk) {
            authBody += chunk.toString('utf8');
        }).on('end', function () {
            var data = JSON.parse(authBody);
            CLIENT.connect(function (err, CLIENT) {
                const db = CLIENT.db("node");
                const collection = db.collection("user");
                if(err) return console.log(err);

                collection.findOne({login: data.login},function(err, doc){
                    console.log("---------");
                    if(doc.password && data.password && data.password !== doc.password ){
                        console.log("Неверный пароль!");
                    }
                    console.log("Добро пожаловать!");
                    CLIENT.close();
                });
            });
            var payload = { login:data.login };
            const token = jwt.sign(payload, SECRET_KEY);
            var respone = "Добро пожаловать " + data.login;
            response.end(token);
        });
    }
    if(request.url == "/tokenvalidate" && request.method == "POST"){
        var tokenVerfify = '';
        request.on('data', function (chunk) {
            tokenVerfify += chunk.toString('utf8');
        }).on('end', function () {
            var decoded = jwt.verify(tokenVerfify, SECRET_KEY);
            if(decoded){
                response.end('true')
            } else {
                response.end('false');
            }
        });
    }
    if (request.url == "/Application/byClass" && request.method == "POST"){
        var Class = "";
        var searchResult;
        request.on('data', function (chunk) {
           Class += chunk.toString('utf8');
        }).on('end', function () {
            unirest.get("https://omgvamp-hearthstone-v1.p.rapidapi.com/cards/classes/" + Class)
                .header("X-RapidAPI-Host", "omgvamp-hearthstone-v1.p.rapidapi.com")
                .header("X-RapidAPI-Key", "bc0537b2d9mshf48b7cac2b51c7ap17b487jsnb51e78cc1f61")
                .end(function (result) {
                    console.log(result.status, result.headers, result.body);
                    searchResult = result.body
                });
            response.end(searchResult)
        })
    }

}).listen(3001, "127.0.0.1", () => {
    console.log("Сервер запущен!")
});

