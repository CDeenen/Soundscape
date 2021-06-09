import {SoundConfig} from "./soundConfig.js";
import {FXConfig} from "./effects/fxConfig.js";
import {sendWS} from "./websocket.js";
import {moduleName} from "../soundscape.js";
import {soundboardConfig} from "./soundboardConfig.js";
import {soundscapeConfig} from "./soundscapeConfig.js";
import {helpMenuMixer} from "./helpMenu.js";

export class MixerApp extends FormApplication {
    constructor(data, options) {
        super(data, options);
        this.mixer;
        this.fxConfig;
        this.soundboardPlaying = [];
        this.sbEn = false;
        this.dragging = 0;
        this.controlDown = false;
    }

    async setMixer(mixer) {
        if (this.mixer != undefined) return;
        this.mixer = mixer;
        await this.mixer.refresh(0);

        let soundboardEnabled = await game.settings.get('soundscape','sbEnabled')

        if (soundboardEnabled) {
            $("#SoundScape_soundboardColumn").css({'display':''})
            $("#SoundScape_soundboardColumn").css({marginLeft: "15px"});	
            $("#soundscape_mixer").css({width:'870px'})  
        }
    }

    rerender() {
        this.render(true); 
    }
  
    /**
     * Default Options for this FormApplication
     */
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            id: "soundscape_mixer",
            title: "Soundscape: "+game.i18n.localize("Soundscape.Mixer"),
            template: "./modules/Soundscape/templates/mixer.html",
            width: "auto"
        });
    }
  
    /**
     * Provide data to the template
     */
    async getData() {
        const channels = this.mixer.channels;
        let channelData = [];
        for (let i=0; i<channels.length; i++) {
            const channelSettings = channels[i].settings;
            const playing = channels[i].soundNode?.playing ? true : false;
            const loaded = channels[i].soundNode?.loaded ? true : false;
            channelData[i] = {
                settings: channelSettings,
                channelIteration: i,
                channelNumber: i+1,
                volume: channelSettings.volume,
                pan: channelSettings.pan*25,
                muteColor: channelSettings.mute ? "rgb(255, 0, 0)" : "rgb(127, 0, 0)",
                soloColor: channelSettings.solo ? "rgb(255, 255, 0)" : "rgb(127, 127, 0)",
                linkColor: channelSettings.link ? "rgb(0, 150, 255)" : "rgb(0, 15, 255)",
                playButton: playing ? 'fas fa-stop' : 'fas fa-play',
                disabled: loaded ? '' : 'disabled'
            }
        }
        const master = this.mixer.master;
        let masterData = {
            volume: master.settings.volume,
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
            sbGain: game.settings.get(moduleName,'soundscapes')[this.mixer.currentSoundscape].soundboardGain
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
        const soundboardEnable = html.find("button[name=soundboardEnable]")
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

        sbStopAll.on('click', event => {
            this.mixer.soundboard.stopAll();
        })
        sbVolume.on('input change', (event)=>{
            this.mixer.soundboard.setVolume(event.target.value);
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
            const sourceId = this.dragging.replace('sbButton-','')
            const targetId = target.id.replace('sbButton-','')
            if (this.controlDown) this.mixer.soundboard.copySounds(sourceId,targetId);
            else this.mixer.soundboard.swapSounds(sourceId,targetId);
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
            this.mixer.stop(undefined,true);
            const nrOfScapes = game.settings.get(moduleName,'soundscapes').length;
            this.mixer.currentSoundscape++;
            if (this.mixer.currentSoundscape >= nrOfScapes-1) this.mixer.currentSoundscape = nrOfScapes-1;
            this.mixer.refresh();
        })
        prevSoundscape.on("click", (event)=>{
            this.mixer.stop(undefined,true);
            this.mixer.currentSoundscape--;
            if (this.mixer.currentSoundscape < 0) this.mixer.currentSoundscape = 0;
            this.mixer.refresh();
        })
        soundscapeName.on("change",(event)=>{
            this.mixer.setSoundscapeName(event.currentTarget.value);
        });

        volumeSlider.on("input change",(event)=>{
            let soundNumber = event.currentTarget.id.replace('volumeSlider-','');
            const val = event.currentTarget.value;
            html.find("input[id=volumeNumber-"+soundNumber+"]")[0].value=val;
            if (soundNumber == 'master') this.mixer.master.setVolume(val);
            else if (this.mixer.channels[soundNumber].getLink()) this.mixer.setLinkVolumes(val,soundNumber)
            else this.mixer.channels[soundNumber].setVolume(val);
            
            let settings = game.settings.get(moduleName,'soundscapes');
            if (soundNumber == 'master') settings[this.mixer.currentSoundscape].master.volume = val;
            else settings[this.mixer.currentSoundscape].channels[soundNumber].volume = val;
            game.settings.set(moduleName,'soundscapes',settings);

            soundNumber++;
            sendWS("CH " + soundNumber + " VOLUME " + val);
        })
        volumeNumber.on("change",(event)=>{
            let soundNumber = event.currentTarget.id.replace('volumeNumber-','');
            const val = event.currentTarget.value;
            html.find("input[id=volumeSlider-"+soundNumber+"]")[0].value=val;
            if (soundNumber == 'master') this.mixer.master.setVolume(val);
            else if (this.mixer.channels[soundNumber].getLink()) this.mixer.setLinkVolumes(val,soundNumber)
            else this.mixer.channels[soundNumber].setVolume(val);

            let settings = game.settings.get(moduleName,'soundscapes');
            if (soundNumber == 'master') settings[this.mixer.currentSoundscape].master.volume = val;
            else settings[this.mixer.currentSoundscape].channels[soundNumber].volume = val;
            game.settings.set(moduleName,'soundscapes',settings);

            soundNumber++;
            sendWS("CH " + soundNumber + " VOLUME " + val);
        })
        mute.on("click",(event)=>{
            const soundNumber = event.currentTarget.id.replace('mute-','');
            let background;
            let mute;
            if (soundNumber == 'master') {
                mute = this.mixer.master.getMute();
                background = mute ? "rgb(138, 0, 0)" : "rgb(255, 0, 0)";
                this.mixer.master.setMute(!mute);
            }
            else {
                mute = this.mixer.channels[soundNumber].getMute();
                background = mute ? "rgb(138, 0, 0)" : "rgb(255, 0, 0)";
                this.mixer.channels[soundNumber].setMute(!mute);
            }
            html.find("button[id=mute-"+soundNumber+"]")[0].style.backgroundColor = background;

            let settings = game.settings.get(moduleName,'soundscapes');
            if (soundNumber == 'master') settings[this.mixer.currentSoundscape].master.mute = !mute;
            else settings[this.mixer.currentSoundscape].channels[soundNumber].mute = !mute;
            game.settings.set(moduleName,'soundscapes',settings);
        })
        solo.on("click",(event)=>{
            const soundNumber = event.currentTarget.id.replace('solo-','');
            if (soundNumber == 'master') return;
            const solo = this.mixer.channels[soundNumber].getSolo();
            const background = solo ? "rgb(129,129,0)" : "rgb(255, 255, 0)";
            this.mixer.channels[soundNumber].setSolo(!solo);
            html.find("button[id=solo-"+soundNumber+"]")[0].style.backgroundColor = background;
            this.mixer.configureSolo();

            let settings = game.settings.get(moduleName,'soundscapes');
            settings[this.mixer.currentSoundscape].channels[soundNumber].solo = !solo;
            game.settings.set(moduleName,'soundscapes',settings);
        })
        link.on("click",(event)=>{
            const soundNumber = event.currentTarget.id.replace('link-','');
            let link = this.mixer.channels[soundNumber].getLink();
            const background = link ? "rgb(0,15,255)" : "rgb(0,150,255)";
            html.find("button[id=link-"+soundNumber+"]")[0].style.backgroundColor = background;
            this.mixer.channels[soundNumber].setLink(!link);
            this.mixer.configureLink();

            let settings = game.settings.get(moduleName,'soundscapes');
            settings[this.mixer.currentSoundscape].channels[soundNumber].link = !link;
            game.settings.set(moduleName,'soundscapes',settings);
        })

        panner.on("input change",(event)=>{
            const soundNumber = event.currentTarget.id.replace('panSlider-','');
            const val = event.currentTarget.value/25;
            this.mixer.channels[soundNumber].setPan(val);

            let settings = game.settings.get(moduleName,'soundscapes');
            settings[this.mixer.currentSoundscape].channels[soundNumber].pan = val;
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
            const soundNumber = event.currentTarget.id.replace('playSound-','');
            const channel = this.mixer.channels[soundNumber];
            if (channel.soundNode == undefined || channel.soundNode.loaded == false) return;
            const playing = channel.soundNode.playing;
            if (playing == false) {
                this.mixer.start(soundNumber);
                html.find(`button[id=playSound-${soundNumber}]`)[0].innerHTML = `<i class="fas fa-stop"></i>`;
                html.find("button[name=play]")[0].innerHTML = `<i class="fas fa-stop"></i>`;
            }
            else {
                await this.mixer.stop(soundNumber);
                html.find(`button[id=playSound-${soundNumber}]`)[0].innerHTML = `<i class="fas fa-play"></i>`;
                if (this.mixer.playing == false) html.find("button[name=play]")[0].innerHTML = `<i class="fas fa-play"></i>`;
            }
        })

        config.on("click",(event)=>{
            const soundNumber = event.currentTarget.id.replace('config-','');
            let soundConfig = new SoundConfig();
            soundConfig.setData(this.mixer.channels[soundNumber],this, this.mixer.currentSoundscape);
            soundConfig.render(true);
        })

        fx.on("click",(event)=>{
            const soundNumber = event.currentTarget.id.replace('fx-','');
            this.fxConfig = new FXConfig();
            this.fxConfig.setData(soundNumber,this,this.mixer);
            this.fxConfig.render(true);
            
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



  