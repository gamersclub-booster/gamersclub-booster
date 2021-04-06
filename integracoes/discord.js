async function enviarDiscord(url, body) {
    await axios.post(url, {
        embeds: [body]
    });
}

async function lobbySender(url, lobbyInfo) {
    //var lobbyInfo = (await axios.post("/lobbyBeta/openRoom")).data;
    if (url.length == 0) return false;
    if (typeof lobbyInfo !== "object") {
        return false;
    }
    await enviarDiscord(url, {
        "title": "Clique aqui para abrir a lobby",
        "url": `https://gamersclub.com.br/j/${lobbyInfo.lobby.lobbyID}/${lobbyInfo.lobby.password}`,
        "fields": [{
                "name": "Tipo da sala:",
                "value": lobbyInfo.lobby.hasPassword ? "FECHADA" : "ABERTA"
            },
            {
                "name": "Admin da sala:",
                "value": `${lobbyInfo.admin.nick} | ${lobbyInfo.admin.level}`
            },
            {
                "name": "Membros:",
                "value": (Object.values(lobbyInfo.members).map(function (e) {
                    return `${e.nick} | ${e.level} | KDR: ${e.kdr} \n`
                })).join(" ")
            }
        ]
    })
}

async function timeStr(objeto) {
    var membersFull = objeto.members;
    var membersArray = Object.values(membersFull);
    var membersString = membersArray.map(function (e) {
        return `${e.level} - ${e.nick} | ${e.kdr} \n`;
    })
    return membersString.join("");
}

async function enviarDadosPartida(url, listenGame) {
   // var listenGame = (await axios.get("https://gamersclub.com.br/lobbyBeta/openGame")).data;
    if (typeof listenGame !== "object") {
        return false;
    }   

    var mapa = (Object.values(listenGame.maps)).filter(function (e) {
        return e.vetoed === undefined;
    })[0].name;

    var urlDoMapa = "";
    switch (mapa) {
        case "de_mirage":
            urlDoMapa = "https://www.esportelandia.com.br/wp-content/uploads/2020/01/posi%C3%A7%C3%B5es-csgo-mirage.jpg";
            break;
        case "de_dust2":
            urlDoMapa = "https://i.pinimg.com/originals/78/56/79/785679110c70f573dbe130420faea69a.jpg";
            break;
        case "de_nuke":
            urlDoMapa = "https://www.esportelandia.com.br/wp-content/uploads/2020/01/posi%C3%A7%C3%B5es-csgo-nuke-768x627.jpg?ezimgfmt=ng:webp/ngcb2";
            break;
        case "de_train":
            urlDoMapa = "https://www.esportelandia.com.br/wp-content/uploads/2020/01/posi%C3%A7%C3%B5es-csgo-train.jpg?ezimgfmt=ng:webp/ngcb2";
            break;
        case "de_overpass":
            urlDoMapa = "https://www.esportelandia.com.br/wp-content/uploads/2020/01/posi%C3%A7%C3%B5e-csgo-overpass.jpg?ezimgfmt=ng:webp/ngcb2";
            break;
        case "de_inferno":
            urlDoMapa = "https://www.esportelandia.com.br/wp-content/uploads/2020/01/posi%C3%A7%C3%B5es-csgo-inferno.jpg?ezimgfmt=ng:webp/ngcb2";
            break;
        case "de_vertigo":
            urlDoMapa = "https://www.esportelandia.com.br/wp-content/uploads/2020/01/vertigo-posicoes-0-cke.jpg?ezimgfmt=ng:webp/ngcb2";
            break;
        case "de_cbble_classic":
            urlDoMapa = "https://www.esportelandia.com.br/wp-content/uploads/2020/01/posi%C3%A7%C3%B5es-csgo-cobblestone.jpg?ezimgfmt=ng:webp/ngcb2";
            break;
    }
    await enviarDiscord(url, {
        "fields": [{
                "name": "Time A",
                "value": (await timeStr(listenGame.room_a)),
            },
            {
                "name": "Time B",
                "value": (await timeStr(listenGame.room_b)),
            },
            {
                "name": "IP da partida:",
                "value": `connect ${listenGame.game.live.ip};password ${listenGame.game.live.password}`
            },
            {
                "name": "Mapa:",
                "value": mapa
            },
            {
                "name": "Link da partida",
                "value": "https://gamersclub.com.br/lobby/partida/" + listenGame.game.gameID
            }
        ],
        "image": {
            "url": urlDoMapa
        }
    })
}