/*
import {SoundConfig} from "./soundConfig.js";
import {FXConfig} from "./effects/fxConfig.js";
import {sendWS} from "./websocket.js";



*/
import {moduleName} from "../../soundscape.js";
import {helpMenuMixer} from "../Help/helpMenus.js";
import {soundboardConfig} from "../Soundboard/soundboardConfig.js";
import {soundscapeConfig} from "../Misc/soundscapeConfig.js";

export class MixerApp extends FormApplication {
    mixer;

    constructor(data, options) {
        super(data, options);
    }

    /**
     * Default Options for this FormApplication
     */
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            id: "soundscape_mixer",
            title: "Soundscape: "+game.i18n.localize("Soundscape.Mixer"),
            template: "./modules/soundscape/src/Mixer/mixerApp.html",
            width: "auto"
        });
    }

    setMixer(mixer) {
        this.mixer = mixer;
    }
  
    /**
     * Provide data to the template
     */
    async getData() {
        const channels = this.mixer.channels;
        let channelData = [];
        for (let i=0; i<channels.length; i++) {
            const channel = channels[i];
            channelData[i] = {
                name: channel.settings.name,
                channelIteration: i,
                channelNumber: i+1,
                volume: channel.settings.volume*100,
                pan: channel.settings.pan*25,
                muteColor: channel.settings.mute ? "rgb(255, 0, 0)" : "rgb(127, 0, 0)",
                soloColor: channel.settings.solo ? "rgb(255, 255, 0)" : "rgb(127, 127, 0)",
                linkColor: channel.settings.link ? "rgb(0, 150, 255)" : "rgb(0, 15, 255)",
                playButton: channel.playing ? 'fas fa-stop' : 'fas fa-play'
            }
        }
        const master = this.mixer.master;
        let masterData = {
            volume: master.settings.volume*100,
            muteColor: master.settings.mute ? "rgb(255, 0, 0)" : "rgb(127, 0, 0)"
        } 
        const soundscapePlaying = this.mixer.playing ? true : false;
        //const soundboardSettings = game.settings.get(moduleName,'soundscapes');
        let soundboardSettings = game.settings.get(moduleName,'soundscapes')[this.mixer.currentSoundscape].soundboard;
        
        const soundboard = [];
        let iteration = 0;
        for (let i=0; i<5; i++) {
            let row = [];
            for (let j=0; j<5; j++) {
                const data = {
                    iteration,
                    name: soundboardSettings[iteration]?.name ? soundboardSettings[iteration].name : '',
                    imageSrc: soundboardSettings[iteration]?.imageSrc ? soundboardSettings[iteration].imageSrc : 'modules/Soundscape/img/transparant.png'
                }
                row.push(data);
                iteration++;
            }
            soundboard.push({row});
        }
        const soundboardEnabled = game.settings.get(moduleName,'sbEnabled')
        const mainWidth = soundboardEnabled ? '870px' : '435px';
        const soundboardDisplay = soundboardEnabled ? '' : 'none';

        return {
            channels: channelData,
            master: masterData,
            playing: soundscapePlaying,
            playingIcon: soundscapePlaying ? 'fas fa-stop' : 'fas fa-play',
            name: this.mixer.name,
            soundScapeNumber: this.mixer.currentSoundscape+1,
            soundScapeIteration: this.mixer.currentSoundscape,
            loadedSounds: this.mixer.loadedSounds,
            soundboard,
            mainWidth,
            soundboardDisplay,
            sbGain: game.settings.get(moduleName,'soundscapes')[this.mixer.currentSoundscape].soundboardGain*100
        } 
    }
  
    /**
     * Update on form submit
     * @param {*} event 
     * @param {*} formData 
     */
    async _updateObject(event, formData) {
  
    }
  
    activateListeners(html) {
        super.activateListeners(html);

        setTimeout(function() {
            document.getElementById('soundscape_mixerHelp').addEventListener("click", (event) => {
                let dialog = new helpMenuMixer();
                dialog.render(true);
            })
        },100)

        const prevSoundscape = html.find("button[name=prevSoundscape]")
        const nextSoundscape = html.find("button[name=nextSoundscape]")
        const soundscapeName = html.find("input[name=soundscapeName");
        const soundscapeConfigBtn = html.find("button[name=soundscapeConfig]");
        const volumeSlider = html.find("input[name=volumeSlider]");
        const volumeNumber = html.find("input[name=volumeNumber]");
        const mute = html.find("button[name=mute]");
        const solo = html.find("button[name=solo]");
        const link = html.find("button[name=link]");
        const fx = html.find("button[name=fx]");
        const config = html.find("button[name=config]");
        const play = html.find("button[name=play]");
        const playSound = html.find("button[name=playSound]");
        const soundName = html.find("input[name=name]");
        const panner = html.find("input[name=panSlider]");
        const channelBox = html.find("div[name=channelBox]")

        const sbButton = html.find("input[name=sbButton");
        const sbButtonLabel = html.find("p[name=sbButtonLabel]");
        const sbVolume = html.find("input[name=sbVolume]");
        const sbStopAll = html.find("button[name=stopSB");
        const sbDelBtn = html.find("div[name=sbDelBtn");

        let parent = this;
        document.onkeydown = function (e) {
            e = e || window.event;
            if (e.key == 'Control' || e.key == 'Command') {
                parent.controlDown = true;
            }
        };
        document.onkeyup = function (e) {
            e = e || window.event;
            if (e.key == 'Control' || e.key == 'Command') {
                parent.controlDown = false;
            }
        };

        channelBox.on('dragover', (event)=>{
            const target = event.currentTarget;
            if (target.id == this.dragging) return;
            target.style.borderColor = 'red';
        })
        channelBox.on('dragleave', (event)=>{
            const target = event.currentTarget;
            if (target.id == this.dragging) return;
            target.style.borderColor = 'black';
        })
        channelBox.on('drop', (event)=>{
            const target = event.currentTarget;
            if (target.id == this.dragging) return;
            target.style.borderColor = 'black';
            const targetId = target.id.replace('box-','')
            
            let data = event.originalEvent.dataTransfer.getData('text/plain');
            try{
                data = JSON.parse(data);
            } catch (e) {
                return;
            }
            this.mixer.newData(targetId,data);

        })

        sbStopAll.on('click', event => {
            this.mixer.soundboard.stopAll();
        })
        sbVolume.on('input change', (event)=>{
            this.mixer.soundboard.setVolume(event.target.value/100);
        })
        sbButton.on('click', (event)=>{
            event.preventDefault();
            const id = event.target.id.replace('sbButton-','');
            this.mixer.soundboard.playSound(id);
        })
        sbButton.on('dragstart', (event)=>{
            const target = event.currentTarget;
            this.dragging = target.id;
        })
        sbButton.on('drop', (event)=>{
            const target = event.currentTarget;
            if (target.id == this.dragging) return;
            target.style.borderColor = 'black';
            const targetId = target.id.replace('sbButton-','')

            let data = event.originalEvent.dataTransfer.getData('text/plain');

            try{
                data = JSON.parse(data);
            } catch (e) {
                const sourceId = this.dragging.replace('sbButton-','')
                if (this.controlDown) this.mixer.soundboard.copySounds(sourceId,targetId);
                else this.mixer.soundboard.swapSounds(sourceId,targetId);
                return;
            }
            this.mixer.soundboard.newData(targetId,data);

        })
        sbButton.on('dragover', (event)=>{
            const target = event.currentTarget;
            if (target.id == this.dragging) return;
            target.style.borderColor = 'red';
        })
        sbButton.on('dragleave', (event)=>{
            const target = event.currentTarget;
            if (target.id == this.dragging) return;
            target.style.borderColor = 'black';
        })
        sbButton.on('dragEnd', (event)=>{
            event.preventDefault();
            const target = event.currentTarget;
        })
        sbDelBtn.on('dragenter', (event)=>{
            const target = event.currentTarget;
            target.style.borderColor = 'red';
        })
        sbDelBtn.on('dragleave', (event)=>{
            const target = event.currentTarget;
            target.style.borderColor = 'black';
        })
        
        sbDelBtn.on('drop', (event)=>{
            const target = event.currentTarget;
            target.style.borderColor = 'black';
            const sourceId = this.dragging.replace('sbButton-','')
            this.mixer.soundboard.deleteSound(sourceId);
        })
        nextSoundscape.on("click", (event)=>{
            //this.mixer.stop(undefined,true);
            const nrOfScapes = game.settings.get(moduleName,'soundscapes').length;
            this.mixer.currentSoundscape++;
            if (this.mixer.currentSoundscape >= nrOfScapes-1) this.mixer.currentSoundscape = nrOfScapes-1;
            this.mixer.setSoundscape(this.mixer.currentSoundscape);
        })
        prevSoundscape.on("click", (event)=>{
            //this.mixer.stop(undefined,true);
            this.mixer.currentSoundscape--;
            if (this.mixer.currentSoundscape < 0) this.mixer.currentSoundscape = 0;
            this.mixer.setSoundscape(this.mixer.currentSoundscape);
        })
        soundscapeName.on("change",(event)=>{
            this.mixer.setSoundscapeName(event.currentTarget.value);
        });

        soundName.on("change",(event)=>{
            let channelNr = event.currentTarget.id.replace('name-','');
            const val = event.currentTarget.value;
            let settings = game.settings.get(moduleName,'soundscapes');
            if (channelNr == 'master') return;
            else settings[this.mixer.currentSoundscape].channels[channelNr].settings.name = val;
            game.settings.set(moduleName,'soundscapes',settings);
        })

        volumeSlider.on("input change",(event)=>{
            let channelNr = event.currentTarget.id.replace('volumeSlider-','');
            const val = event.currentTarget.value/100;
            html.find("input[id=volumeNumber-"+channelNr+"]")[0].value=Math.ceil(val*100);
            if (channelNr == 'master') this.mixer.master.setVolume(val);
            else if (this.mixer.channels[channelNr].getLink()) this.mixer.setLinkVolumes(val,channelNr)
            else this.mixer.channels[channelNr].setVolume(val);
            
            let settings = game.settings.get(moduleName,'soundscapes');
            if (channelNr == 'master') settings[this.mixer.currentSoundscape].master.settings.volume = val;
            else settings[this.mixer.currentSoundscape].channels[channelNr].settings.volume = val;
            game.settings.set(moduleName,'soundscapes',settings);
        })
        volumeNumber.on("change",(event)=>{
            let channelNr = event.currentTarget.id.replace('volumeNumber-','');
            const val = event.currentTarget.value/100;
            html.find("input[id=volumeSlider-"+channelNr+"]")[0].value=val*100;
            if (channelNr == 'master') this.mixer.master.setVolume(val);
            else if (this.mixer.channels[channelNr].getLink()) this.mixer.setLinkVolumes(val,channelNr)
            else this.mixer.channels[channelNr].setVolume(val);

            let settings = game.settings.get(moduleName,'soundscapes');
            if (channelNr == 'master') settings[this.mixer.currentSoundscape].master.settings.volume = val;
            else settings[this.mixer.currentSoundscape].channels[channelNr].settings.volume = val;
            game.settings.set(moduleName,'soundscapes',settings);
        })
        mute.on("click",(event)=>{
            const channelNr = event.currentTarget.id.replace('mute-','');
            let background;
            let mute;
            if (channelNr == 'master') {
                mute = this.mixer.master.getMute();
                background = mute ? "rgb(138, 0, 0)" : "rgb(255, 0, 0)";
                this.mixer.master.setMute(!mute);
            }
            else {
                mute = this.mixer.channels[channelNr].getMute();
                background = mute ? "rgb(138, 0, 0)" : "rgb(255, 0, 0)";
                this.mixer.channels[channelNr].setMute(!mute);
            }
            html.find("button[id=mute-"+channelNr+"]")[0].style.backgroundColor = background;

            let settings = game.settings.get(moduleName,'soundscapes');
            if (channelNr == 'master') settings[this.mixer.currentSoundscape].master.mute = !mute;
            else settings[this.mixer.currentSoundscape].channels[channelNr].settings.mute = !mute;
            game.settings.set(moduleName,'soundscapes',settings);
        })
        solo.on("click",(event)=>{
            const channelNr = event.currentTarget.id.replace('solo-','');
            if (channelNr == 'master') return;
            const solo = this.mixer.channels[channelNr].getSolo();
            const background = solo ? "rgb(129,129,0)" : "rgb(255, 255, 0)";
            this.mixer.channels[channelNr].setSolo(!solo);
            html.find("button[id=solo-"+channelNr+"]")[0].style.backgroundColor = background;
            this.mixer.configureSolo();

            let settings = game.settings.get(moduleName,'soundscapes');
            settings[this.mixer.currentSoundscape].channels[channelNr].settings.solo = !solo;
            game.settings.set(moduleName,'soundscapes',settings);
        })
        link.on("click",(event)=>{
            const channelNr = event.currentTarget.id.replace('link-','');
            let link = this.mixer.channels[channelNr].getLink();
            const background = link ? "rgb(0,15,255)" : "rgb(0,150,255)";
            html.find("button[id=link-"+channelNr+"]")[0].style.backgroundColor = background;
            this.mixer.channels[channelNr].setLink(!link);
            this.mixer.configureLink();

            let settings = game.settings.get(moduleName,'soundscapes');
            settings[this.mixer.currentSoundscape].channels[channelNr].settings.link = !link;
            game.settings.set(moduleName,'soundscapes',settings);
        })

        panner.on("input change",(event)=>{
            const channelNr = event.currentTarget.id.replace('panSlider-','');
            const val = event.currentTarget.value/25;
            this.mixer.channels[channelNr].setPan(val);

            let settings = game.settings.get(moduleName,'soundscapes');
            settings[this.mixer.currentSoundscape].channels[channelNr].settings.pan = val;
            game.settings.set(moduleName,'soundscapes',settings);
        })

        play.on("click",(event)=>{
            if (this.mixer.playing == false) {
                this.mixer.start();
                html.find("button[name=play]")[0].innerHTML = `<i class="fas fa-stop"></i>`;
                for (let i=0; i<8; i++) {
                    const channel = this.mixer.channels[i];
                    if (channel.soundNode != undefined && channel.soundNode.loaded)
                        html.find(`button[id=playSound-${i}]`)[0].innerHTML = `<i class="fas fa-stop"></i>`;
                }
            }
            else {
                this.mixer.stop();
                html.find("button[name=play]")[0].innerHTML = `<i class="fas fa-play"></i>`;
                for (let i=0; i<8; i++) {
                    html.find(`button[id=playSound-${i}]`)[0].innerHTML = `<i class="fas fa-play"></i>`;
                }
            }
        })

        playSound.on("click",async (event)=>{
            const channelNr = event.currentTarget.id.replace('playSound-','');
            const channel = this.mixer.channels[channelNr];
            const playing = channel.playing;
            if (playing == false) {
                this.mixer.start(channelNr);
                html.find(`button[id=playSound-${channelNr}]`)[0].innerHTML = `<i class="fas fa-stop"></i>`;
                html.find("button[name=play]")[0].innerHTML = `<i class="fas fa-stop"></i>`;
            }
            else {
                await this.mixer.stop(channelNr);
                html.find(`button[id=playSound-${channelNr}]`)[0].innerHTML = `<i class="fas fa-play"></i>`;
                if (this.mixer.playing == false) html.find("button[name=play]")[0].innerHTML = `<i class="fas fa-play"></i>`;
            }
        })

        config.on("click",(event)=>{
            const channelNr = event.currentTarget.id.replace('config-','');
            this.mixer.channels[channelNr].renderConfig();
        })

        fx.on("click",(event)=>{
           const channelNr = event.currentTarget.id.replace('fx-','');
           this.mixer.channels[channelNr].renderFxConfig();
        })

        sbButtonLabel.on("click", async (event)=>{
            const soundNumber = event.currentTarget.id.replace('sbButtonLabel-','');
            let dialog = await new soundboardConfig();
            await dialog.setMixer(this.mixer,soundNumber,this);
            dialog.render(true);
        })
        
        soundscapeConfigBtn.on("click", async(event)=>{
            let dialog = await new soundscapeConfig();
            await dialog.setMixer(this.mixer,this);
            dialog.render(true);
        });
    }
}



  