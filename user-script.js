const CLIENT_ID = 'e0OVCfzFT27RI1eD';
const mode = parseInt((new URLSearchParams(window.location.search)).get('mode') || 0);
const SYSTEM_NAMES = ['Kluczowy Komputer', 'Zaszyfrowywacz', 'Obliczacz'];

let members = [];
let initialised = false;

window.onload = () => addMessageToListDOM("Ładowanie systemu...");

const drone = new ScaleDrone(CLIENT_ID, {
    data: {
        name: getRandomName(),
        color: getRandomColor(),
        admin: false, //Nie, zmienienie tego na 'true' nic nie da. Przestań czytać kod, idź rozwiązuj zagadki.
        mode: mode,
    },
});

drone.on('open', error => {
    if (error) {
        return console.error(error);
    }
    console.log('Successfully connected to Scaledrone');


    const room = drone.subscribe('observable-room');
    room.on('open', error => {
        if (error) {
            return console.error(error);
        }
        console.log('Successfully joined room');
    });

    room.on('members', members => {
        for (member of members) {
            if (member.clientData.admin) return;
        }
        addMessageToListDOM(SYSTEM_NAMES[mode] + " jest chwilowo nieaktywny. Spróbuj ponownie później."); //Tak generalnie to nie powinno się to stać
    });

    room.on('member_leave', (left) => {
        /*for (member of members) {
            if (member.clientData.admin && member.id !== id) return;
        }*/
        if (left.clientData.admin) {
            addMessageToListDOM(SYSTEM_NAMES[mode] + " wyłączył się."); //To też nie
            initialised = false;
        }
    });



    room.on('data', (data, member) => {
        if (member) {
            if (data.type === 'all') displayMessage(data);

            if (data.mode !== mode) return;

            if (data.type === 'welcome' && initialised === false) initialised = true;
            else if (data.type === 'welcome') return;

            displayMessage(data.content, member);


        } else {
            // Message is from server
        }
    });
});

function displayMessage(message, member) {
    let lines = message.split('\n');
    for (line in lines) {
        addMessageToListDOM(lines[line], member.clientData.admin);
    }
}

drone.on('close', event => {
    console.log('Connection was closed', event);
});

drone.on('error', error => {
    console.error(error);
});

function getRandomName() {
    const adjs = ["autumn", "hidden", "bitter", "misty", "silent", "empty", "dry", "dark", "summer", "icy", "delicate", "quiet", "white", "cool", "spring", "winter", "patient", "twilight", "dawn", "crimson", "wispy", "weathered", "blue", "billowing", "broken", "cold", "damp", "falling", "frosty", "green", "long", "late", "lingering", "bold", "little", "morning", "muddy", "old", "red", "rough", "still", "small", "sparkling", "throbbing", "shy", "wandering", "withered", "wild", "black", "young", "holy", "solitary", "fragrant", "aged", "snowy", "proud", "floral", "restless", "divine", "polished", "ancient", "purple", "lively", "nameless"];
    const nouns = ["waterfall", "river", "breeze", "moon", "rain", "wind", "sea", "morning", "snow", "lake", "sunset", "pine", "shadow", "leaf", "dawn", "glitter", "forest", "hill", "cloud", "meadow", "sun", "glade", "bird", "brook", "butterfly", "bush", "dew", "dust", "field", "fire", "flower", "firefly", "feather", "grass", "haze", "mountain", "night", "pond", "darkness", "snowflake", "silence", "sound", "sky", "shape", "surf", "thunder", "violet", "water", "wildflower", "wave", "water", "resonance", "sun", "wood", "dream", "cherry", "tree", "fog", "frost", "voice", "paper", "frog", "smoke", "star"];
    return adjs[Math.floor(Math.random() * adjs.length)] + "_" + nouns[Math.floor(Math.random() * nouns.length)];
}

function getRandomColor() {
    return '#' + Math.floor(Math.random() * 0xFFFFFF).toString(16);
}

//------------- DOM STUFF

const DOM = {
    messages: document.querySelector('.messages'),
    input: document.querySelector('.message-form__input'),
    form: document.querySelector('.message-form'),
};

DOM.form.addEventListener('submit', sendMessage);

switch (mode) {
    case 0: DOM.input.placeholder = "Wprowadź klucz. a = A. a b = ab"; break;
    case 1: DOM.input.placeholder = "Wprowadź tekst."; break;
    case 2: DOM.input.placeholder = "Wprowadź tekst."; break;
}

function sendMessage() {
    const value = DOM.input.value.trim();
    if (value === '') {
        return;
    } else if (!validateKey(value) && mode === 0) {
        addMessageToListDOM("Błąd: nieprawidłowy format klucza.");
        return;
    }
    DOM.input.value = '';
    drone.publish({
        room: 'observable-room',
        message: { type: 'user', mode: mode, content: value }
    });
}

function validateKey(key) {
    return key.substring(0, 6) === "klucz[" && key[key.length - 1] === "]"
}

function createMemberElement(admin = true) {
    const el = document.createElement('div');
    el.appendChild(document.createTextNode(admin ? "" : ">"));
    el.className = 'member';
    el.style.color = "#00CC00";
    return el;
}


function createMessageElement(text, admin) {
    const el = document.createElement('div');
    el.style.color = "#00FF00";
    el.appendChild(createMemberElement(admin));
    el.appendChild(document.createTextNode(text));
    el.className = 'message';
    return el;
}

function addMessageToListDOM(text, admin = true) {
    const el = DOM.messages;
    const wasTop = el.scrollTop === el.scrollHeight - el.clientHeight;
    el.appendChild(createMessageElement(text, admin));
    if (wasTop) {
        el.scrollTop = el.scrollHeight - el.clientHeight;
    }
}