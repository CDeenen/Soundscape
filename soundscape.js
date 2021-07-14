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

Hooks.on('ready',async ()=>{
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

        let soundElements = document.getElementsByClassName('sound-name');
        for (let elem of soundElements) {
            const playlist = elem.parentElement.getAttribute('data-playlist-id');
            const sound = elem.parentElement.getAttribute('data-sound-id');
            if (playlist == undefined || sound == undefined) continue;
            elem.draggable = true;
            elem.ondragstart = (event) => {
                const data = {
                        type: 'playlist_single',
                        playlist,
                        sound
                    }
                event.dataTransfer.effectAllowed = 'move';
                event.dataTransfer.setData('text/plain', JSON.stringify(data));
            };
        }
    }
});