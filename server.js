const http = require('http');
const WebSocket = require('ws');
const axios = require('axios');
const fs = require('fs');
const _ = require('lodash');

const server = http.createServer();
const wss = new WebSocket.Server({server});

//let bankCurrencyAPI = 'http://socket.loc/test-currency.json';
let bankCurrencyAPI = 'https://api.monobank.ua/bank/currency';

let APIUpdateFrequency = 2 * 60 * 1000;
const webSocketPort = 3001;

let oldCurrencies = {};
let iteration = 0;
let currenciesNames = {};

// Запускаем WS сервер 
server.listen(webSocketPort, async () => {
    console.log('WebSocket server is running on webSocketPort ' + webSocketPort);
    // загружаем имена
    await getCurrenciesNames();
    updater();
    setInterval(updater, APIUpdateFrequency);
});


// Запускаем обработчики при(от)соединения клиента к серверу. Отправляем сразу и таблицу и имена.
wss.on('connection', (socket) => {
    console.log('WebSocket connected');
    socket.send(JSON.stringify({data: (oldCurrencies), names: currenciesNames}));

    // Обработка закрытия соединения
    socket.on('close', () => {
        console.log('WebSocket disconnected');
    });
});

// Отправляет данные клиентам (все или только изменившиеся). Имена, поидее, должны отправляться только первый раз при соединении. 
function sendToAll(data, names = null) {
    let dataTXT = JSON.stringify({data: data});
    wss.clients.forEach(function (client) {
        client.send(dataTXT);
    });
}

async function getCurrenciesFromAPI() {
    try {
        let ver = Math.random();
        const response = await axios.get(bankCurrencyAPI, {
            params: {
                ver: ver
            },
            headers: {
                'Cache-Control': 'no-cache'
            }
        });
        console.log('Сделан запрос к API ' + bankCurrencyAPI + ' v' + Math.random())
        return response.data;
    } catch (error) {
        console.error(error);
        throw new Error('Не удалось получить данные из API');
    }
}


// Это что-то типа контроллера. Вызывает api, ищет изменения, отправляет всем клиентам, если находит.
async function updater() {

    console.log(++iteration);

    let newCurrencies = await getCurrenciesFromAPI();

    let difference = _.differenceWith(newCurrencies, oldCurrencies, _.isEqual);

    if (difference.length > 0) {
        console.log('Что то обновилось!');

        sendToAll(difference);

        iteration = 0;
        oldCurrencies = newCurrencies;
    } else {
        console.log('Пока без изменений');
    }
}

// Получает айдишники и имена всех валют из файла
async function getCurrenciesNames() {
    return fs.readFile('codes-all_json.json', 'utf8', async (err, data) => {
        if (err) {
            console.error(`Ошибка при чтении файла: ${err}`);
        } else {
            try {
                let currenciesJson = JSON.parse(data)
                for (let item of currenciesJson) {
                    // Закидываю в глобальную переменную. Но можно было бы и с промисами поколдовать  
                    currenciesNames[item.NumericCode] = {0: item.Currency, 1: item.AlphabeticCode};
                }
            } catch (err) {
                console.error(`Ошибка при парсинге JSON: ${err}`);
            }

        }
    });
}
