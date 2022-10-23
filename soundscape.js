import { Mixer } from "./src/Mixer/mixer.js";
import { registerSettings } from "./src/Misc/settings.js";
import { socket } from "./src/Misc/socket.js";
import { importConfigForm } from "./src/Misc/import.js";

export const moduleName = "soundscape";

export let mixer;

Hooks.once('init', function() { 
    registerSettings();

    setTimeout(async function(){
        if (game.user.isGM) {}
           // await game.settings.set(moduleName,'sbEnabled',false)
        else {     
            const payload = {
                "msgType": "getChannelSettings",
                "userId": game.userId
            };
            game.socket.emit(`module.soundscape`, payload);
        }
    },1000);
});

Hooks.once('ready',async ()=>{
    

    mixer = new Mixer();
    
    /*
    setTimeout(function() {
        if (game.user.isGM) mixer.renderApp(true);
    },1000)
    */

    game.socket.on(`module.soundscape`, (payload) =>{ socket(payload) });

    if (game.settings.get(moduleName,'firstBoot')) {

    }
})

Hooks.on("renderSidebarTab", (app, html) => {
   
    if (app.options.id == 'playlists') {
         /**
         * Create labels and buttons in sidebar
         */
        const volumeSlider = $(`
            <li class="sound flexrow">
                <h4 class="sound-name">Soundscape</h4>
                <i class="volume-icon fas fa-volume-down"></i>
                <input class="global-volume-slider" name="soundscapeVolume" type="range" min="0" max="1" step="0.05" value="${game.settings.get(moduleName,'volume')}">
            </li>
            `
        );
        $('#global-volume').find('.playlist-sounds').append(volumeSlider);
        const vol = html.find("input[name=soundscapeVolume]");
        vol.on("input change", event => {
            const volume = event.target.value;
            if (mixer != undefined) mixer.master.effects.interfaceGain.set(volume);
            game.settings.set(moduleName,'volume',volume)
        });

        
        if (game.user.isGM == false) return;

        const btn = $(
            `
            <div class="header-actions action-buttons flexrow">
                <button id="soundscapeOpen">
                    <i></i> Soundscape
                </button>
            </div>
            `
        );
        html.find(".directory-header").prepend(btn);
        btn.on("click",async event => {
            mixer.renderApp(true);
        });
    }
});

Hooks.on('setSoundscape',(data) => {
    const mixerApp = document.getElementById('soundscape_mixer');

    let settings = game.settings.get(moduleName,'soundscapes');
            
    if (data.msgType == 'start') {
        mixer.start();
        if (mixerApp != null) document.getElementById('playMix').innerHTML = `<i class="fas fa-stop"></i>`;
    }
    else if (data.msgType == 'stop') {
        mixer.stop();
        if (mixerApp != null) document.getElementById('playMix').innerHTML = `<i class="fas fa-play"></i>`;
    }
    else if (data.msgType == 'setVolume') {
        const channel = data.channelNr;
        let volume = data.volume;
        if (volume < 0) volume = 0;
        else if (volume > 1.25) volume = 1.25;
        if (channel == 'master') mixer.master.setVolume(volume);
        else if (channel < 100) {
            if (mixer.channels[channel].getLink()) mixer.setLinkVolumes(volume,channel)
            else mixer.channels[channel].setVolume(volume);
        }
        if (mixerApp != null) document.getElementById(`volumeSlider-${channel}`).value=volume*100;
        if (mixerApp != null) document.getElementById(`volumeNumber-${channel}`).value=volume*100;
        if (channel == 'master') settings[mixer.currentSoundscape].master.settings.volume = volume;
        else settings[mixer.currentSoundscape].channels[channel].settings.volume = volume;
    }
    else if (data.msgType == 'setChannel') {
        const channel = data.channelNr;
        const mute = data.mute;
        const solo = data.solo;
        const link = data.link;
        const playing = data.playing;
        if (mute != undefined) {
            mixer.channels[channel].setMute(mute);
            const background = mute ? "rgb(255, 0, 0)" : "rgb(138, 0, 0)";
            if (mixerApp != null) document.getElementById(`mute-${channel}`).style.backgroundColor = background;
            settings[mixer.currentSoundscape].channels[channel].settings.mute = mute;
        }
        else if (solo != undefined) {
            mixer.channels[channel].setSolo(solo);
            mixer.configureSolo();
            const background = solo ? "rgb(255, 255, 0)" : "rgb(129,129,0)";
            if (mixerApp != null) document.getElementById(`solo-${channel}`).style.backgroundColor = background;
            settings[mixer.currentSoundscape].channels[channel].settings.solo = solo;
        }
        else if (link != undefined) {
            mixer.channels[channel].setLink(link);
            const background = link ? "rgb(0,150,255)" : "rgb(0,15,255)";
            if (mixerApp != null) document.getElementById(`link-${channel}`).style.backgroundColor = background;
            mixer.configureLink();
            settings[mixer.currentSoundscape].channels[channel].settings.link = link;
        }
        else if (playing != undefined) {
            if (playing) {
                mixer.start(channel);
                if (mixerApp != null) {
                    document.getElementById(`playSound-${channel}`).innerHTML = `<i class="fas fa-stop"></i>`;
                    document.getElementById('playMix').innerHTML = `<i class="fas fa-stop"></i>`;
                }
            }
            else {
                mixer.stop(channel);
                if (mixerApp != null) {
                    document.getElementById(`playSound-${channel}`).innerHTML = `<i class="fas fa-play"></i>`;
                    if (mixer.playing == false) document.getElementById('playMix').innerHTML = `<i class="fas fa-play"></i>`;
                }
            }
        }
    }
    else if (data.msgType == 'playSoundboard') {
        mixer.soundboard.playSound(data.channelNr);
    }
    else if (data.msgType == 'setSoundboardVolume') {
        let volume = data.volume;
        if (volume < 0) volume = 0;
        else if (volume > 1.25) volume = 1.25;
        mixer.soundboard.setVolume(volume);
        if (mixerApp != null) document.getElementById(`sbVolume`).value=volume*100;
    }
    else if (data.msgType == 'stopSoundboard') mixer.soundboard.stopAll();
    else return;

    game.settings.set(moduleName,'soundscapes',settings);
});

Hooks.on('renderSceneConfig', (app, html) => {

    let loadSoundscape = game.i18n.localize("SOUNDSCAPE.None");
    let combatSoundscape = game.i18n.localize("SOUNDSCAPE.None");

    if(app.object.data.flags["soundscape"]){
        if (app.object.data.flags['soundscape'].loadSoundscape)
            loadSoundscape = app.object.getFlag('soundscape', 'loadSoundscape');

        if (app.object.data.flags['soundscape'].combatSoundscape)
            combatSoundscape = app.object.getFlag('soundscape', 'combatSoundscape');
    }

    let options = ``;
    let combatOptions = ``;
    for (let soundscape of game.settings.get(moduleName,'soundscapes')) {
        options += `<option value=${soundscape.name} ${soundscape.name == loadSoundscape ? 'selected' : ''}>${soundscape.name}</option>`;
        combatOptions += `<option value=${soundscape.name} ${soundscape.name == combatSoundscape ? 'selected' : ''}>${soundscape.name}</option>`;
    }
        

    const newHtml = `
        <div class="form-group">
            <label>${game.i18n.localize("SOUNDSCAPE.LoadSoundscape")}</label>
                <select name="loadSoundscape" id="loadSoundscape" value=${loadSoundscape}>
                <option value='None'>${game.i18n.localize("SOUNDSCAPE.None")}</option>
                ${options}
                </select>
            <p class="notes">${game.i18n.localize("SOUNDSCAPE.LoadSoundscape_Hint")}</p>
        </div>
        <div class="form-group">
            <label>${game.i18n.localize("SOUNDSCAPE.CombatSoundscape")}</label>
                <select name="combatSoundscape" id="combatSoundscape" value=${combatSoundscape}>
                <option value='None'>${game.i18n.localize("SOUNDSCAPE.None")}</option>
                ${combatOptions}
                </select>
            <p class="notes">${game.i18n.localize("SOUNDSCAPE.CombatSoundscape_Hint")}</p>
        </div>
    `
    const elmnt = html.find('select[name="playlistSound"]').closest('div[class="form-group"]')
    elmnt.after(newHtml);
});

Hooks.on("closeSceneConfig", (app, html) => {
    const loadSoundscape = html.find("select[id='loadSoundscape']")[0].value;
    const combatSoundscape = html.find("select[id ='combatSoundscape']")[0].value;

    app.object.setFlag('soundscape', 'loadSoundscape',loadSoundscape);
    app.object.setFlag('soundscape', 'combatSoundscape',combatSoundscape);
});

Hooks.on('canvasReady',async (canvas)=>{
    if (!game.user.isGM || !canvas.scene?.active) return;

    let loadSoundscape;
    if (game.combat != undefined && game.combat.round > 0 && canvas.scene.getFlag('soundscape', 'combatSoundscape') != undefined && canvas.scene.getFlag('soundscape', 'combatSoundscape') != null)
        loadSoundscape = canvas.scene.getFlag('soundscape', 'combatSoundscape');
    else
        loadSoundscape = canvas.scene.getFlag('soundscape', 'loadSoundscape');

    if (loadSoundscape != undefined && loadSoundscape != 'None') {
        const soundscapes = game.settings.get(moduleName,'soundscapes');
        for (let i=0; i<soundscapes.length; i++)
            if (soundscapes[i].name == loadSoundscape) {
                if (mixer == undefined) {
                    setTimeout(async function() {
                        if (mixer.currentSoundscape != i) await mixer.setSoundscape(i);
                        if (!mixer.playing) mixer.start();
                    },1000)
                }
                else {
                    if (mixer.currentSoundscape != i) await mixer.setSoundscape(i);
                    if (!mixer.playing) mixer.start();
                }
            }
    }
})

Hooks.on('updateCombat',async ()=>{
    if (!game.user.isGM) return;

    const combatSoundscape = canvas.scene.getFlag('soundscape', 'combatSoundscape');

    if (combatSoundscape != undefined && combatSoundscape != 'None') {
        const soundscapes = game.settings.get(moduleName,'soundscapes');
        for (let i=0; i<soundscapes.length; i++)
            if (soundscapes[i].name == combatSoundscape) {
                if (mixer == undefined) {
                    setTimeout(async function() {
                        if (mixer.currentSoundscape != i) await mixer.setSoundscape(i);
                        if (!mixer.playing) mixer.start();
                    },1000)
                }
                else {
                    if (mixer.currentSoundscape != i) await mixer.setSoundscape(i);
                    if (!mixer.playing) mixer.start();
                }
            }
    }
})

Hooks.on('deleteCombat',async ()=>{
    if (!game.user.isGM) return;

    const loadSoundscape = canvas.scene.getFlag('soundscape', 'loadSoundscape');

    if (loadSoundscape != undefined && loadSoundscape != 'None') {
        const soundscapes = game.settings.get(moduleName,'soundscapes');
        for (let i=0; i<soundscapes.length; i++)
            if (soundscapes[i].name == loadSoundscape) {
                if (mixer == undefined) {
                    setTimeout(async function() {
                        if (mixer.currentSoundscape != i) await mixer.setSoundscape(i);
                        if (!mixer.playing) mixer.start();
                    },1000)
                }
                else {
                    if (mixer.currentSoundscape != i) await mixer.setSoundscape(i);
                    if (!mixer.playing) mixer.start();
                }
            }
    }
})