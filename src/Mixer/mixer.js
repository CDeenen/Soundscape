import { moduleName } from "../../soundscape.js";
import { Channel } from "../Channels/channel.js"
import { Soundboard } from "../Soundboard/soundboard.js";
import { MixerApp } from "./mixerApp.js";

export class Mixer {
    mixerSize = 8;
    mixerApp;
    currentSoundscape = 0;
    master;
    channels = [];
    name = "";
    playing = false;
    linkArray = [];
    linkProportion = [];
    highestVolume = 0;
    highestVolumeIteration = 0;
    
    constructor(data, options) {
       this.constr();
    }

    async constr() {
        if (game.user.isGM) this.mixerApp = new MixerApp();
        this.audioCtx = await new AudioContext();

        for (let i=0; i<this.mixerSize; i++) {
            await this.channels.push(new Channel(this,i));
        }
        this.master = await new Channel(this,"master");
        this.soundboard = await new Soundboard(this)

        this.setSoundscape(0);

        let parent = this;
        let ctxInterval = setInterval(function(){
            if (parent.audioCtx.state == 'suspended') {
                try {
                    parent.audioCtx.resume();
                }
                catch (error) {
                   
                }
                
            }
            else if (parent.audioCtx.state == 'running') {
                clearInterval(ctxInterval);
                const payload = {
                    "msgType": "getSettings",
                    "userId": game.userId
                };
                game.socket.emit(`module.soundscape`, payload);
            }
        },500)
    }

    renderApp(render) {
        this.mixerApp.setMixer(this);
        this.mixerApp.render(render);
        this.mixerApp.width = "auto";
    }

    async newData(targetId,data) {
        let settings = game.settings.get(moduleName,'soundscapes');
        let channelSettings = settings[this.currentSoundscape].channels[targetId];
        if (channelSettings == null) return;

        if (data.type == 'playlist_multi') {
            const plName = game.playlists.get(data.playlist).name;
            if (channelSettings.settings.name == undefined || channelSettings.settings.name == "") channelSettings.settings.name = plName;
            channelSettings.soundData.playlistName = plName;
            channelSettings.soundData.soundSelect = data.type;
        }
        else if (data.type == 'playlist_single') {
            const pl = game.playlists.get(data.playlist);
            if (pl == undefined) return;
            const plName = pl.name;
            const soundName = pl.sounds.get(data.sound).name;
            if (channelSettings.settings.name == undefined || channelSettings.settings.name == "") channelSettings.settings.name = soundName;
            channelSettings.soundData.playlistName = plName;
            channelSettings.soundData.soundName = soundName;
            channelSettings.soundData.soundSelect = data.type;
        }
        else if (data.type == 'filepicker_single' || data.type == 'filepicker_folder') {
            channelSettings.soundData.source = data.source;
            if (channelSettings.settings.name == undefined || channelSettings.settings.name == "") channelSettings.settings.name = data.name;
            channelSettings.soundData.soundSelect = data.type;
        }
        /** Support for Moulinette **/
        else if (data.source == 'mtte' && data.type == 'Sound') {
            // retrieve path
            const soundName = data.sound.filename.split("/").pop().replace(/\.[^/.]+$/, "") // removes extension
            const assetUrl = await game.moulinette.applications.MoulinetteAPI.getAssetURL("sounds", data.pack.idx, data.sound.filename)
            if(assetUrl) {
                channelSettings.soundData.source = assetUrl;
                if (channelSettings.settings.name == undefined || channelSettings.settings.name == "") channelSettings.settings.name = soundName;
                channelSettings.soundData.soundSelect = 'filepicker_single';
            }
        }

        settings[this.currentSoundscape].channels[targetId] = channelSettings;

        this.channels[targetId].setData(channelSettings)
        await game.settings.set(moduleName,'soundscapes',settings);
        this.renderApp(true); 
    }

    async setSource(channel,sources,play) {
        if (channel == undefined) {
            for (let i=0; i<8; i++)
                this.channels[i].setSource(sources[i],undefined,play)
        }
        else
            this.channels[channel].setSource(sources[channel],undefined,play)
    }

    start(channel = undefined) {
        let sources = [];
        for (let i=0; i<8; i++) {
            sources.push(this.channels[i].source)
        }
        if (game.user.isGM) {
            const payload = {
              "msgType": "start",
              channel,
              sources
            };
            game.socket.emit(`module.soundscape`, payload);
            Hooks.call(moduleName,payload);
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

    stop(channel = undefined, fadeOut = false, force = true) {
        if (game.user.isGM) {
            const payload = {
              "msgType": "stop",
              "force": force,
              channel
            };
            game.socket.emit(`module.soundscape`, payload);
            Hooks.call(moduleName,payload);
        }
        if (channel == undefined && fadeOut) this.master.effects.gain.node.gain.setTargetAtTime(0,this.audioCtx.currentTime,0.25);
        
        if (channel == undefined) {
            this.playing = false;
            for (let channel of this.channels) {
                if (fadeOut)
                    setTimeout(function(){
                        channel.stop(force);
                    },1000)
                else 
                    channel.stop(force);
            }  
        }
        else {
            this.channels[channel].stop(force);
            this.playing = false;
            for (let channel of this.channels) {
                if (channel.playing) {
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
            if (soloOn == false || channel.getSolo()) channel.setVolume(undefined,undefined,true);
            else (channel.setVolume(0,false,true))
        }     
    }

    configureLink() {
        this.linkArray = [];
        let highestVolume = 0;
        let highestVolumeIteration = 0;
        for (let channel of this.channels) {
            const link = channel.settings.link;
            this.linkArray[channel.channelNr] = channel.settings.volume > 0 ? link : false;

            if (link) {
                const volume = channel.settings.volume;
                if (volume > highestVolume) {
                    highestVolume = volume;
                    highestVolumeIteration = channel.channelNr;
                }
                this.linkProportion[channel.channelNr] = volume;
            }
            else
                this.linkProportion[channel.channelNr] = 0;

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
            if (this.linkArray[channel.channelNr]) {
                linkVolume = channel.settings.volume;
                linkVolume = this.linkProportion[channel.channelNr]*diff;  
            }  
            if (channel.getLink()) {
                linkVolume = Math.floor(linkVolume*100)/100;
                if (linkVolume < 0) linkVolume = 0;
                else if (linkVolume > 1.25) linkVolume = 1.25;
                channel.setVolume(linkVolume);
                if (channel.channelNr != channel) {
                    $('#volumeSlider-'+channel.channelNr)[0].value=Math.ceil(linkVolume*100);
                    $('#volumeNumber-'+channel.channelNr)[0].value=Math.ceil(linkVolume*100);
                }
            }
        }
    }

    async setSoundscape(newSoundscape) {
        const playingTemp = this.playing;
        this.stop(undefined,true);
        this.currentSoundscape = newSoundscape;
        //Get the setings
        let settings = game.settings.get(moduleName,'soundscapes')[this.currentSoundscape];
        if (settings == undefined) {
            settings = this.newSoundscape();
            let allSettings = game.settings.get(moduleName,'soundscapes');
            allSettings[this.currentSoundscape] = settings;
            await game.settings.set(moduleName,'soundscapes',allSettings);
        }
        this.name = settings.name;
        for (let i=0; i<this.mixerSize; i++) {
            this.channels[i].setData(settings.channels[i]);
        }

        this.master.setVolume(settings.master.settings.volume);
        this.master.setMute(settings.master.settings.mute);

        this.soundboard.configure(settings);

        let parent = this;
        if (playingTemp) 
            setTimeout(function() {
                parent.start();
            }, 1000);

        if (this.mixerApp != undefined && this.mixerApp.rendered) {
           await this.renderApp(true);
        }
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

            //change to new data structure, see channel.js
            channels[i] = {
                channel: i,
                soundData: {
                    soundSelect: "playlist_single",
                    playlistName: "",
                    soundName: "",
                    source: ""  
                },
                settings: {
                    channel: i,
                    name: '',
                    volume: 1,
                    pan: 0,
                    link: false,
                    solo: false,
                    mute: false,
                    repeat: 'none',
                    randomize: false,
                    playbackRate: {
                        rate: 1,
                        preservePitch: 1,
                        random: 0
                    },
                    timing: {
                        startTime: 0,
                        stopTime: 0,
                        skipFirstTiming: false,
                        fadeIn: 0,
                        fadeOut: 0,
                        skipFirstFade: false
                    },
                    effects: {
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
                        delay: {
                            enable: false,
                            delayTime: 0.25,
                            volume: 0.5
                        }
                    }
                }
            }
        }
        let sbData = [];
        for (let i=0; i<25; i++) {
            sbData.push ({
                channel: 100+parseInt(i),
                soundData: {
                    soundSelect: "playlist_single",
                    playlistName: "",
                    soundName: "",
                    source: ""  
                },
                playbackRate: {
                    rate: 1,
                    preservePitch: 1,
                    random: 0
                },
                name: '',
                volume: 1,
                randomizeVolume: 0,
                repeat: {
                    repeat: 'none',
                    minDelay: 0,
                    maxDelay: 0
                },
                randomize: false,
                imageSrc: ''
            })
        }
        settings = {
            name: "",
            channels: channels,
            master: {
                settings: {
                    volume: 1,
                    mute: false
                }
            },
            soundboard: sbData,
            soundboardGain: 0.5
        }
        return settings;
    }

    /**
     * Toggle player to which sounds are sent
     * @returns true if all players are active
     */
    togglePlayer(playerId) {
        if(playerId == "*" || playerId == "-") {
            this.soundboard.players = {}
            for (const p of game.users.players) {
                if(p.active) {
                    this.soundboard.players[p._id] = (playerId == "*")
                }
            }
        }
        else {
            if(playerId in this.soundboard.players) {
                this.soundboard.players[playerId] = !this.soundboard.players[playerId]
            }
        }
        // check if one player is not enabled
        for (const p of game.users.players) {
            if(!p.active) continue
            if(!(p._id in this.soundboard.players) || !this.soundboard.players[p._id]) {
                return false
            }
        }
        return true
    }
}