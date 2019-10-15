const HTTP = require("http");
//const MONGOCLIENT = require("mongodb").MongoClient;
//const jwt = require('jsonwebtoken');
const unirest = require("unirest");
const SECRET_KEY = "QsafQAWRIOjh1";
const IMGDATABASE = require('hearthstone-card-images');
const IMAGES = indexCardImages();
const PUPPETEER = require('puppeteer');
const express = require('express');
const app = express();
const WebSocket = require('ws');

/*Develop Branch*/
function indexCardImages() {
    let images = {};
    let base = IMGDATABASE.config.base;
    let version = IMGDATABASE.config.version;
    for (let type in IMGDATABASE.cards) {
        for (let id in IMGDATABASE.cards[type]) {
            let url = `${base}/${version}/${type}/${id}.png`;
            images[id] = url;
        }
    }
    return images
}

// ----------- WEBSOCKET SERVER
const server = new WebSocket.Server({port: 8080});
server.on("connection", (ws) => {
    console.log("Подключлися пользователь")
});


app.post('/Application/getCardPackWinrate', function (request, response) {
    let top5 = [];
    request.on('data', function () {
        console.log("Пошел!")
    }).on('end', function () {
        (async function requsetStat() {
            const browser = await PUPPETEER.launch({
                args: ['--no-sandbox']
            });
            const page = await browser.newPage();
            const pageURL = 'https://hsreplay.net/decks/#sortBy=winrate';
            try {
                await page.goto(pageURL);
            } catch (error) {
                console.log(`Не удалось открыть страницу: ${pageURL} из-за ошибки: ${error}`);
            }
            const postsSelector = '#decks-container > main > div.deck-list-wrapper > section > ul > li:nth-child(n+2):nth-child(-n+6) > a';
            await page.waitForSelector(postsSelector, {timeout: 0});
            const postUrls = await page.$$eval(
                postsSelector, Li => Li.map(a => a.href)
            );
            const winrateSelector = '#decks-container > main > div.deck-list-wrapper > section > ul > li:nth-child(n+2):nth-child(-n+6) > a > div > div:nth-child(2) > span';
            const postWinrate = await page.$$eval(
                winrateSelector, span => span.map(span => span.innerText)
            );
            const nameSelector = "#decks-container > main > div.deck-list-wrapper > section > ul > li:nth-child(n+2):nth-child(-n+6) > a > div > div.col-lg-2.col-md-2.col-sm-2.col-xs-6 > h3";
            const postName = await page.$$eval(
                nameSelector, name => name.map(name => name.innerText)
            );
            top5.push(postUrls, postWinrate, postName);
            let object = [];
            for (let i = 0; i <= 4; i++) {
                object[i] = {};
                object[i].url = postUrls[i];
                object[i].name = postName[i];
                object[i].winrate = postWinrate[i];
            }
            await browser.close();
            response.setHeader("Content-Type", "application/json");
            response.end(JSON.stringify(object));
            console.log(`Ответ : ${top5}`)
        })();
    })
});

app.post('/Application/getCards', function (request, response) {
    var inputValue = "";
    var searchResult;
    request.on('data', function (chunk) {
        inputValue += chunk.toString('utf8');
    }).on('end', function () {
        switch (inputValue) {
            case 'Warrior':
            case 'Mage':
            case 'Shaman':
            case 'Warlock':
            case 'Priest':
            case 'Rogue':
            case 'Hunter':
            case 'Paladin':
            case 'Druid':
                unirest.get("https://omgvamp-hearthstone-v1.p.rapidapi.com/cards/classes/" + inputValue)
                    .header("X-RapidAPI-Host", "omgvamp-hearthstone-v1.p.rapidapi.com")
                    .header("X-RapidAPI-Key", "bc0537b2d9mshf48b7cac2b51c7ap17b487jsnb51e78cc1f61")
                    .end(function (result) {
                        searchResult = result.body;
                        response.setHeader("Content-Type", "application/json");
                        if (searchResult.error == "404") return;
                        searchResult.map(card => {
                            card.img = IMAGES[card.dbfId];
                        });
                        console.log(searchResult[1]);
                        response.end(JSON.stringify(searchResult))
                    });
                break;
            case 'Alliance':
            case 'Horde':
                unirest.get("https://omgvamp-hearthstone-v1.p.rapidapi.com/cards/factions/" + inputValue)
                    .header("X-RapidAPI-Host", "omgvamp-hearthstone-v1.p.rapidapi.com")
                    .header("X-RapidAPI-Key", "bc0537b2d9mshf48b7cac2b51c7ap17b487jsnb51e78cc1f61")
                    .end(function (result) {
                        searchResult = result.body;
                        response.setHeader("Content-Type", "application/json");
                        if (searchResult.error == "404") return;
                        searchResult.map(card => {
                            card.img = IMAGES[card.dbfId];
                        });

                        console.log(searchResult[1]);

                        response.end(JSON.stringify(searchResult))
                    });
                break;
            case 'Beast':
            case 'Demon':
            case 'Dragon':
            case 'Mech':
            case 'Murloc':
            case 'Pirate':
            case 'Totem':
            case 'Elemental':
                unirest.get("https://omgvamp-hearthstone-v1.p.rapidapi.com/cards/races/" + inputValue)
                    .header("X-RapidAPI-Host", "omgvamp-hearthstone-v1.p.rapidapi.com")
                    .header("X-RapidAPI-Key", "bc0537b2d9mshf48b7cac2b51c7ap17b487jsnb51e78cc1f61")
                    .end(function (result) {
                        searchResult = result.body;
                        response.setHeader("Content-Type", "application/json");
                        if (searchResult.error == "404") return;
                        searchResult.map(card => {
                            card.img = IMAGES[card.dbfId];
                        });
                        response.end(JSON.stringify(searchResult))
                    });
                break;
        }
    })
});

app.post('/register', (request, response) => {
    var body = '';
    request.on('data', function (chunk) {
        body += chunk.toString('utf8');
    }).on('end', function () {
        var data = JSON.parse(body);
        CLIENT.connect(function (err, CLIENT) {
            const db = CLIENT.db("local");
            const collection = db.collection("ReactDB");
            let user = {login: data.login, password: data.password};
            collection.insertOne(user, function (err, result) {
                if (err) {
                    return console.log(err);
                }
                console.log(result.ops);
                CLIENT.close();
            });
        });
        response.end();
    });
});

app.post('/authorizaton', (request, reponse) => {
    var authBody = '';
    request.on('data', function (chunk) {
        authBody += chunk.toString('utf8');
    }).on('end', function () {
        var data = JSON.parse(authBody);
        CLIENT.connect(function (err, CLIENT) {
            const db = CLIENT.db("node");
            const collection = db.collection("user");
            if (err) return console.log(err);

            collection.findOne({login: data.login}, function (err, doc) {
                console.log("---------");
                if (doc.password && data.password && data.password !== doc.password) {
                    console.log("Неверный пароль!");
                }
                console.log("Добро пожаловать!");
                CLIENT.close();
            });
        });
        var payload = {login: data.login};
        const token = jwt.sign(payload, SECRET_KEY);
        var respone = "Добро пожаловать " + data.login;
        response.end(token);
    });
});

// app.post('/tokenvalidate', (request, response) => {
//     var tokenVerfify = '';
//     request.on('data', function (chunk) {
//         tokenVerfify += chunk.toString('utf8');
//     }).on('end', function () {
//         var decoded = jwt.verify(tokenVerfify, SECRET_KEY);
//         decoded ? response.end('true') : response.end('false')
//     });
// });

app.listen(3001, () => {
    console.log("Слушаю 3001 порт")
});

