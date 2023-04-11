//// Init

let currenciesNames = {};

const outputElement = document.getElementById('output');


startClient();


//// Functions

function startClient() {

    let socket = new WebSocket('ws://localhost:3001');

    socket.addEventListener('open', (event) => {
        console.log('WebSocket connected');
    });

    socket.addEventListener('message', (event) => {
        let response = JSON.parse(event.data);
        let data = response.data;

        console.log(`Received message: `, response);

        //Загружаем всю таблицу в самом начале
        if (!outputElement.innerHTML) {
            currenciesNames = response.names;
            outputElement.innerHTML = generateHtmlTable(data);
        } else {
            updateHtmlTable(data);
        }
    });

    socket.addEventListener('close', (event) => {
        console.log('WebSocket disconnected');
    });
}


function generateHtmlTable(data) {
    let tableHtml = "<table class='table'>";
    tableHtml += "<tr>";
    for (let key in data[0]) {
        tableHtml += `<th>${key}</th>`;
    }
    tableHtml += "</tr>";

    // Создаем строки таблицы с данными
    for (let i = 0; i < data.length; i++) {
        let id = generateId(data[i]);
        tableHtml += `<tr id="${id}">`;
        tableHtml += generateHtmlLine(data[i]);
        tableHtml += "</tr>";
    }

    tableHtml += "</table>";

    return tableHtml;
}

function generateId(line) {
    return 'id' + line['currencyCodeA'] + '_' + line['currencyCodeB'];
}

function generateHtmlLine(line) {
    let out = '';
    for (let key in line) {
        if (key === 'currencyCodeA' || key === 'currencyCodeB') {
            let td_data = currenciesNames[line[key]] !== undefined ? currenciesNames[line[key]][0] : '';
            out += `<td>${td_data} (${line[key]})</td>`;
        } else if (key === 'date') {
            out += '<td>' + ts2date(line[key]) + '</td>';
        } else {
            out += `<td>${line[key]}</td>`;
        }
    }
    return out;
}

function updateHtmlTable(data) {
    for (let i in data) {
        let ob = document.getElementById(generateId(data[i]));
        ob.innerHTML = generateHtmlLine(data[i])
        ob.classList.add('new-data');
        setTimeout(() => ob.classList.remove('new-data'), 2000);
    }
}

function ts2date(timestamp) {
    const now = new Date(timestamp * 1000);
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds} ${day}.${month}.${year}`;
}