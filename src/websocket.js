import { moduleName, mixer } from "../soundscape.js";

//Websocket variables
let ip = "192.168.1.189";       //Ip address of the websocket server
let port = "3000";                //Port of the websocket server
var ws;                         //Websocket variable
let wsOpen = false;             //Bool for checking if websocket has ever been opened => changes the warning message if there's no connection
let wsInterval;                 //Interval timer to detect disconnections

/**
 * Analyzes the message received from the IR tracker.
 * If coordinates are received, scale the coordinates to the in-game coordinate system, find the token closest to those coordinates, and either take control of a new token or update the position of the image of that token
 * If no coordinates are received, move token to last recieved position
 * 
 * @param {*} msg Message received from the IR tracker
 */
async function analyzeWSmessage(msg,passthrough = false){
    //console.log('raw',msg);
    let data = JSON.parse(msg);
    if (data.status == "ping") return;
    //console.log('json',data);

    if (data.status == "setVolume") {
        let channelNr = data.channel;
        const volume = data.volume;
        const msg = "CH " + channelNr + " VOLUME " + volume;
        //console.log('sendMsg',msg)
        channelNr --;
        sendWS(msg);
        
        //console.log('setVolume',channelNr,volume,mixer);
        const channel = mixer.channels[channelNr];
       // console.log('channel',channel)
        //channel.setVolume(volume);
        
        if (channel.getLink()) mixer.setLinkVolumes(volume,channelNr)
        else channel.setVolume(volume);
        if ($('#soundscape_mixer')[0] != undefined) {
            $('#volumeSlider-'+channelNr)[0].value = volume;
            $('#volumeNumber-'+channelNr)[0].value = volume;
        }
        
        
    }
    
};

/**
 * Start a new websocket
 * Start a 10s interval, if no connection is made, run resetWS()
 * If connection is made, set interval to 1.5s to check for disconnects
 * If message is received, reset the interval, and send the message to analyzeWSmessage()
 */
export function startWebsocket() {
    console.log("starting WS")
    //ip = game.settings.get(moduleName,'address');
    ws = new WebSocket('ws://'+ip+':'+port);

    ws.onmessage = function(msg){
        analyzeWSmessage(msg.data);
        clearInterval(wsInterval);
        wsInterval = setInterval(resetWS, 5000);
    }

    ws.onopen = function() {
        console.log("Soundscape: Websocket connected")
        ui.notifications.info("Soundscape: Connected");
        wsOpen = true;
        clearInterval(wsInterval);
        wsInterval = setInterval(resetWS, 5000);
    }
  
    clearInterval(wsInterval);
    wsInterval = setInterval(resetWS, 10000);
}

/**
 * Try to reset the websocket if a connection is lost
 */
function resetWS(){
    if (wsOpen) {
        console.log("Soundscape: Disconnected from server");
        ui.notifications.warn("Soundscape: Disconnected");
    }
    else {
        console.log("Soundscape: Connection to server failed");
        ui.notifications.warn("Soundscape: Connection to server failed");
    }
    startWebsocket();
}


export function sendWS(txt){
    if (wsOpen) ws.send(txt);
}