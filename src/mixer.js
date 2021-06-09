import {moduleName} from "../soundscape.js";
import {Channel} from "./channel.js"
import { Soundboard } from "./soundboard.js";

export let currentSoundscape;

export class Mixer {
    constructor(data, options) {
        this.mixerSize = 8;

        this.currentSoundscape = 0;
        this.master;
        this.channels = [];
        this.name = "";
        this.playing = false;
        this.loadedSounds = [];
        this.mixerApp;
        this.linkArray = [];
        this.linkProportion = [];
        this.highestVolume = 0;
        this.highestVolumeIteration = 0;
        
        //this.refresh(this.currentSoundscape);
    }

    setApp(mixerApp) {
        this.mixerApp = mixerApp;
    }

    setSoundscapeName(name) {
        this.name = name;
        let settings = game.settings.get(moduleName,'soundscapes')[this.currentSoundscape];
        settings.name = name;
        this.updateSettings(settings,this.currentSoundscape)
        //this.updateSettings
    }

    updateSettings(newSettings,iteration) {
        let allSettings = game.settings.get(moduleName,'soundscapes');
        allSettings[iteration] = newSettings;
        game.settings.set(moduleName,'soundscapes',allSettings);
    }

    start(channel = undefined) {
        if (game.user.isGM) {
            const payload = {
              "msgType": "start",
              channel
            };
            game.socket.emit(`module.Soundscape`, payload);
        }
        this.configureSolo();
        this.playing = true;
        if (channel == undefined)
            for (let channel of this.channels) {
                channel.play();
            }
        else
            this.channels[channel].play();
    }

    stop(channel = undefined, fadeOut = false) {
        if (game.user.isGM) {
            const payload = {
              "msgType": "stop",
              channel
            };
            game.socket.emit(`module.Soundscape`, payload);
        }
        if (channel == undefined && fadeOut) this.master.effects.gain.node.gain.setTargetAtTime(0,game.audio.context.currentTime,0.25);
        
        if (channel == undefined) {
            this.playing = false;
            for (let channel of this.channels) {
                if (fadeOut)
                    setTimeout(function(){
                        channel.stop();
                    },1000)
                else 
                    channel.stop();
            }
                
        }
        else {
            this.channels[channel].stop();
            this.playing = false;
            for (let channel of this.channels) {
                if (channel.soundNode != undefined && channel.soundNode.playing) {
                    this.playing = true;
                    return;
                }
            }
        }
    }

    configureSolo(){
        let soloOn = false;
        for (let channel of this.channels) 
            if (channel.getSolo()) {
                soloOn = true
                break;
            }
        for (let channel of this.channels) {
            if (soloOn == false || channel.getSolo()) channel.setVolume();
            else (channel.setVolume(0,false))
        }     
    }

    configureLink() {
        this.linkArray = [];
        let highestVolume = 0;
        let highestVolumeIteration = 0;
        for (let channel of this.channels) {
            const link = channel.link;
            this.linkArray[channel.settings.channel] = channel.volume > 0 ? link : false;

            if (link) {
                const volume = channel.volume;
                if (volume > highestVolume) {
                    highestVolume = volume;
                    highestVolumeIteration = channel.settings.channel;
                }
                this.linkProportion[channel.settings.channel] = parseInt(volume);
            }
            else
                this.linkProportion[channel.settings.channel] = 0;

        }
        if (highestVolume > 0) {
            for (let i=0; i<8; i++) {
                this.linkProportion[i] /= highestVolume;
            }
        }
        this.highestVolume = highestVolume;
        this.highestVolumeIteration = highestVolumeIteration;
    }

    async setLinkVolumes(volume,channel) {
        let diff = volume / this.linkProportion[channel];
        for (let channel of this.channels) {
            let linkVolume = volume;
            if (this.linkArray[channel.settings.channel]) {
                linkVolume = channel.volume;
                linkVolume = this.linkProportion[channel.settings.channel]*diff;  
            }  
            if (channel.getLink()) {
                if (linkVolume < 0) linkVolume = 0;
                else if (linkVolume > 125) linkVolume = 125;
                channel.setVolume(linkVolume);
                if (channel.settings.channel != channel) {
                    $('#volumeSlider-'+channel.settings.channel)[0].value=linkVolume;
                    $('#volumeNumber-'+channel.settings.channel)[0].value=linkVolume;
                }
            }
        }
    }

    /**
     * Refreshes the mixer with a new soundscape
     * @param {number} currentSoundscape The soundscape to load
     */
    async refresh() {
        
        //Get the setings
        let settings = game.settings.get(moduleName,'soundscapes')[this.currentSoundscape];
        if (settings == undefined) {
            settings = this.newSoundscape();
            let allSettings = game.settings.get(moduleName,'soundscapes');
            allSettings[this.currentSoundscape] = settings;
            await game.settings.set(moduleName,'soundscapes',allSettings);
        }

        this.name = settings.name;
        this.master = await new Channel(settings.master,this,true)
        this.soundboard = await new Soundboard(settings.soundboard,settings.soundboardGain,this)
        this.channels = [];
        this.soundboard.refresh();
        
        for (let i=0; i<this.mixerSize; i++) {
            this.channels.push(new Channel(settings.channels[i],this));
        }

        if (this.mixerApp != undefined && this.mixerApp.rendered) {
            await this.mixerApp.render(true);
        }
        let parent = this;
        setTimeout(function(){
            for (let i=0; i<parent.channels.length; i++) {
                if (parent.channels[i].soundNode == undefined) continue;
                const loaded = parent.channels[i].loaded;
                if (document.getElementById(`playSound-${i}`) != null)
                    document.getElementById(`playSound-${i}`).disabled = loaded ? '' : 'disabled';
            }
         }, 10);
    }

    /**
     * Insert a new soundscape
     * @param {number} location The location of the soundscape to insert
     * @returns 
     */
    insertSoundscape(location) {
        let settings = game.settings.get(moduleName,'soundscapes');
        settings.splice(location,0,this.newSoundscape());
        return game.settings.set(moduleName,'soundscapes',settings);
    }

    /**
     * Remove a soundscape
     * @param {number} location The location of the soundscape to remove
     * @returns 
     */
    async removeSoundscape(location,mixerApp=false) {
        let settings = game.settings.get(moduleName,'soundscapes');
        settings.splice(location,1);
        if (this.currentSoundscape > settings.length -1 ) this.currentSoundscape = settings.length-1;
        if (settings.length == 0) {
            settings.push(this.newSoundscape());
            this.currentSoundscape = 0;
        }
        await game.settings.set(moduleName,'soundscapes',settings);
        await this.refresh(this.currentSoundscape);
        if (mixerApp != false) mixerApp.render(true);
    }

    /**
     * Initialize a new soundscape
     * @returns {object} The new soundscape data
     */
    newSoundscape() {
        let settings = {};
        let channels = []
        for (let i=0; i<8; i++) {
            channels[i] = {
                channel: i,
                name: "",
                volume: 100,
                mute: false,
                solo: false,
                link: false,
                repeat: false,
                soundData: {
                    soundSelect: "playlist_single",
                    playlistName: "",
                    soundName: "",
                    source: "",
                    startTime:0,
                    stopTime:0,
                    fade: {
                        fadeIn: 0,
                        fadeOut: 0,
                        crossfade: false
                    },
                    randomize: false
                },
                effects: {
                    panner: {
                        pan: 0
                    },
                    equalizer: {
                        highPass: {
                            enable: false,
                            frequency: 50,
                            q: 1
                        },
                        peaking1: {
                            enable: false,
                            frequency: 500,
                            q: 1,
                            gain: 1
                        },
                        peaking2: {
                            enable: false,
                            frequency: 1000,
                            q: 1,
                            gain: 1
                        },
                        lowPass: {
                            enable: false,
                            frequency: 2000,
                            q: 1
                        }
                    },
                    playbackRate: {
                        enable: false,
                        rate: 1
                    },
                    delay: {
                        enable: false,
                        delayTime: 0.25,
                        volume: 0.5
                    }
                }
            }
        }
        settings = {
            name: "",
            channels: channels,
            master: {
                volume: 100,
                mute: false
            },
            soundboard: [],
            soundboardGain: 50
        }
        return settings;
    }
}
