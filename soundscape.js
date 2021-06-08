import {Mixer} from "./src/mixer.js";
import {MixerApp} from "./src/mixerApp.js";
import {registerSettings} from "./src/settings.js";
import {startWebsocket} from "./src/websocket.js";

export const moduleName = "soundscape";
export let mixer;
export let audioCtx;
let mixerApp;

Hooks.once('init', function()                                         { });

Hooks.on('canvasReady',()                                         =>  { onReady() });
Hooks.on('setSoundscape',(data) => setSoundscape(data) );

Hooks.on('ready',()=>{
    game.socket.on(`module.Soundscape`, (payload) =>{
        //console.log(payload);
        if (mixer == undefined) return;
        if (game.user.isGM && payload.msgType == 'getSettings') {
            let channels = [];
            for (let i=0; i<mixer.channels.length; i++) {
                const soundNode = mixer.channels[i].soundNode;
                if (soundNode == undefined) 
                    channels.push({
                        currentTime: undefined, 
                        playing: false
                    })
                else 
                    channels.push({
                        currentTime: soundNode.currentTime,
                        playing: soundNode.playing
                    })
            }
            const payload2 = {
                "msgType": "setSettings",
                "targetUserId": payload.userId,
                "channels": channels
            };
            game.socket.emit(`module.Soundscape`, payload2);
        }
        else if (payload.msgType == 'setSettings' && game.userId == payload.targetUserId) {
            for (let i=0; i<payload.channels.length; i++) {
                if (payload.channels[i].playing) {
                    mixer.channels[i].play(payload.channels[i].currentTime);
                }
            }
        }

        else if (payload.msgType == 'preloadSound' && payload.channelNr != undefined) { 
            mixer.channels[payload.channelNr].settings = payload.settings;
            mixer.channels[payload.channelNr].preloadSound(payload.source)
        }
        else if (payload.msgType == 'start') mixer.start(payload.channel);
        else if (payload.msgType == 'stop') mixer.stop(payload.channel);

        else if (payload.msgType == 'setVolume') (payload.channelNr == undefined) ? mixer.master.setVolume(payload.volume,payload.save) : mixer.channels[payload.channelNr].setVolume(payload.volume,payload.save);
        else if (payload.msgType == 'setMute') (payload.channelNr == undefined) ? mixer.master.setMute(payload.mute) : mixer.channels[payload.channelNr].setMute(payload.mute);
        else if (payload.msgType == 'setSolo' && payload.channelNr != undefined) mixer.channels[payload.channelNr].setSolo(payload.solo);
        else if (payload.msgType == 'setPan' && payload.channelNr != undefined) mixer.channels[payload.channelNr].setPan(payload.pan);

        else if (payload.msgType == 'eqSetEnable' && payload.channelNr != undefined) mixer.channels[payload.channelNr].effects.eq.setEnable(payload.filterId,payload.enable);
        else if (payload.msgType == 'eqSetFrequency' && payload.channelNr != undefined) mixer.channels[payload.channelNr].effects.eq.setFrequency(payload.filterId,payload.frequency);
        else if (payload.msgType == 'eqSetQ' && payload.channelNr != undefined) mixer.channels[payload.channelNr].effects.eq.setQ(payload.filterId,payload.qualityFactor);
        else if (payload.msgType == 'eqSetGain' && payload.channelNr != undefined) mixer.channels[payload.channelNr].effects.eq.setGain(payload.filterId,payload.gain);
        else if (payload.msgType == 'setPlaybackRate' && payload.channelNr != undefined) mixer.channels[payload.channelNr].effects.playbackRate.set(payload.rate);
        else if (payload.msgType == 'delaySetEnable' && payload.channelNr != undefined) mixer.channels[payload.channelNr].effects.delay.setEnable(payload.enable);
        else if (payload.msgType == 'delaySetDelay' && payload.channelNr != undefined) mixer.channels[payload.channelNr].effects.delay.setDelay(payload.delay);
        else if (payload.msgType == 'delaySetVolume' && payload.channelNr != undefined) mixer.channels[payload.channelNr].effects.delay.setVolume(payload.volume);

        else if (payload.msgType == 'playSoundboard') {
            const audio = new Audio(payload.src);
            const source = game.audio.context.createMediaElementSource(audio);
            source.mediaElement.volume = payload.volume;
            source.mediaElement.playbackRate = payload.playbackSpeed;
            source.connect(mixer.master.effects.soundboardGain.node).connect(mixer.master.effects.interfaceGain.node).connect(game.audio.context.destination);
            audio.play({volume:payload.volume});
        }
        else if (payload.msgType == 'setSoundboardVolume') {
            mixer.master.effects.soundboardGain.set(payload.volume);
        }


        
        
    }); 
})

function setSoundscape(data) {
    if (game.user.isGM == false) return;

    let channelNr = data.channel == 'master' ? 0 : data.channel;
    const channel = channelNr == 0 ? mixer.master : mixer.channels[channelNr-1];
    if (channelNr > 0) channelNr --;

    
    if (data.mode == 'mute') {
        let val = data.action == 'toggle' ? !channel.mute : data.action;
        if ($('#soundscape_mixer')[0] != undefined) {
            $('#mute-'+channelNr)[0].style.backgroundColor = val ? "rgb(255, 0, 0)" : "rgb(127, 0, 0)";
        }
        channel.setMute(val);
    }
    if (data.mode == 'solo') {
        let val = data.action == 'toggle' ? !channel.solo : data.action;
        if ($('#soundscape_mixer')[0] != undefined) {
            $('#solo-'+channelNr)[0].style.backgroundColor = val ? "rgb(255, 255, 0)" : "rgb(129,129,0)";
        }
        channel.setSolo(val);
        mixer.configureSolo();
    }
    if (data.mode == 'link') {
        let val = data.action == 'toggle' ? !channel.link : data.action;
        if ($('#soundscape_mixer')[0] != undefined) {
            $('#link-'+channelNr)[0].style.backgroundColor = val ? "rgb(0,150,255)" : "rgb(0,15,255)";
        }
        channel.setLink(val);
        mixer.configureLink();
    }
    
}

Hooks.once('init', async()=>{
    //CONFIG.debug.hooks = true;
    registerSettings();

    //Load testSound to initiate audio context
    const testPath = "modules/Soundscape/test.mp3";
    let testSound = new Sound(testPath);
    if(testSound.loaded == false) await testSound.load();
    
    setTimeout(async function(){
        if (game.user.isGM) await game.settings.set(moduleName,'sbEnabled',false)
        
        mixer = await new Mixer();
        await mixer.refresh(0);

        if (game.user.isGM == false) {
            let preloadInterval = setTimeout(function() {
                clearInterval(preloadInterval);
                const payload = {
                    "msgType": "getSettings",
                    "userId": game.userId
                };
                game.socket.emit(`module.Soundscape`, payload);
            },2000)
        }
        else {
            
            mixerApp = new MixerApp();
            await mixerApp.setMixer(mixer);
            mixerApp.render(true);
            mixer.setApp(mixerApp);
            
        }
     }, 500);
    
})

function onReady() {
    
    setTimeout(function(){
       // let dialog = new MixerApp();
       // dialog.render(true);
    }, 1000);
}

Hooks.on("renderSidebarTab", (app, html) => {

/**
 * Create labels and buttons in sidebar
 */
    if (app.options.id == 'playlists') {
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
            if ($('#soundscape_mixer')[0] != undefined) return;
            if (mixerApp == undefined) mixerApp = new MixerApp();
            await mixerApp.setMixer(mixer);
            mixerApp.render(true);
            mixer.setApp(mixerApp);
        });
    }

    
    
});
