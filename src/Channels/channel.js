import {Delay} from "./Effects/delay.js";
import {Gain} from "./Effects/gain.js";
import {Pan} from "./Effects/pan.js";
import {EQ} from "./Effects/eq.js";
import {moduleName} from "../../soundscape.js";
import {SoundConfig} from "./soundConfig.js";
import {FXConfig} from "./Effects/fxConfig.js";

'use strict';

export class Channel {
    constructor(mixer,channelNr) {
        this.mixer = mixer;
        this.context = mixer.audioCtx;
        this.channelNr = channelNr;

        if (channelNr == "master") {
            this.master = true;
            this.effects = {
                gain: new Gain(this.settings.volume,this.context),
                interfaceGain: new Gain(game.settings.get(moduleName,'volume'),this.context)
            }
        }
        else if (channelNr > 100) {
            this.effects = {
                gain: new Gain(this.settings.volume,this.context)
            }
        }
        else {
            this.effects = {
                gain: new Gain(this.settings.volume,this.context),
                pan: new Pan(this.settings.pan,this.context),
                fft: undefined,
                eq: new EQ(this,this.context),
                delay: new Delay(this,this.context)
            }
        }
        
    }

    master = false;

    playing = false;
    paused = false;
    
    duration = 0;

    sourceArray = [];
    currentlyPlaying = 0;
    loaded = false;
    fadeStarted = false;
    source;

    firstLoop = true;

    settings = {
        channel: 0,
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
            fadeIn: 0,
            fadeOut: 0
        },
        effects: {}
    }
    soundData = {
        soundSelect: "playlist_single",
        playlistName: "",
        soundName: "",
        source: "",
    }

    async setData(data) {
        
        this.stop();
        this.audioElement = undefined;
        this.settings = data.settings;
        this.setMute(data.settings.mute);
        this.setSolo(data.settings.solo);
        this.setLink(data.settings.link);
        this.setVolume(data.settings.volume);
        this.setPan(data.settings.pan);
        if (data.sourceArray == undefined) data.sourceArray = await this.getSounds(data.soundData);
        this.sourceArray = data.sourceArray;
        if (this.sourceArray == undefined || this.sourceArray[0] == undefined) return;
        this.currentlyPlaying = data.currentlyPlaying == undefined ? 0 : data.currentlyPlaying;
        this.setSource(this.sourceArray[this.currentlyPlaying]);
        
        if (this.channelNr == "master") {

        }
        else {
            this.setPlaybackRate(data.settings.playbackRate);
            this.effects.delay.initialize(data.settings.effects.delay);
            this.effects.eq.initialize(data.settings.effects.equalizer);
        }

        if (game.user.isGM) {
            data.soundArray = this.soundArray;

            const payload = {
              "msgType": "soundConfig",
              "channel": this.channelNr,
              "data": data
            };
            game.socket.emit(`module.soundscape`, payload);
            Hooks.call(moduleName,payload);
        }
    }

    async setSbData(data,currentlyPlaying=0) {

        if (this.mixer.mixer.mixerApp != undefined && this.mixer.mixer.mixerApp.rendered) {
            const color = (data.repeat.repeat == 'single' || data.repeat.repeat == 'all') ? 'yellow' : 'black';
            const elmnt = document.getElementById(`sbButton-${data.channel-100}`);
            elmnt.style.borderColor = color;
            elmnt.style.boxShadow = (color == 'yellow') ? "0 0 10px yellow" : "";
        }

        this.loaded = false;
        this.stop();
        this.settings = data;

        this.setVolume(data.volume);
        if (data.sourceArray == undefined) data.sourceArray = await this.getSounds(data.soundData);
        this.sourceArray = data.sourceArray;
        if (game.user.isGM) {
            data.soundArray = this.soundArray;

            const payload = {
              "msgType": "sbSoundConfig",
              "channel": this.channelNr,
              "data": data
            };
            game.socket.emit(`module.soundscape`, payload);
            Hooks.call(moduleName,payload);
        }
        if (this.sourceArray == undefined || this.sourceArray[0] == undefined) return;
        this.currentlyPlaying = currentlyPlaying;
        this.setSource(this.sourceArray[currentlyPlaying]);
        this.setPlaybackRate(data.playbackRate);
        
        
    }

    async getSounds(soundData) {
        let soundArray = [];
        if (soundData.soundSelect == 'playlist_single') {
            const playlist = game.playlists.getName(soundData.playlistName);
            if (playlist == undefined) return;
            const sound = playlist.sounds.getName(soundData.soundName);
            if (sound == undefined) return;
            soundArray.push(sound.data.path)
            soundData.randomize = false;
        }
        else if (soundData.soundSelect == 'playlist_multi') {
            const playlist = game.playlists.getName(soundData.playlistName);
            if (playlist == undefined) return;
            
            //Add all sounds in playlist to array
            for (let sound of playlist.sounds) 
                soundArray.push(sound.data.path)  
        }
        else if (soundData.soundSelect == 'filepicker_single') {
            const source = soundData.source;
            const ret = await FilePicker.browse("data", source, {wildcard:true});
            const files = ret.files;
        
            //Add all sounds in playlist to array
            for (let file of files) 
                soundArray.push(file)
        }
        else if (soundData.soundSelect == 'filepicker_folder') {
            const source = soundData.source;
            const ret = await FilePicker.browse("data", source);
            const files = ret.files;
    
            //Add all sounds in playlist to array
            for (let file of files) 
            soundArray.push(file)
        }

        //Randomize array
        if (this.settings.randomize) return this.randomizeArray(soundArray)
        else return soundArray;
        
    }

    randomizeArray(array) {
        for (let i = array.length - 1; i >= 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            const temp = array[i];
            array[i] = array[j];
            array[j] = temp;
        }
        return array;
    }

    async play(currentTime = undefined) {
        if (this.loaded == false || this.playing && this.paused==false && this.channelNr < 100) return;
        if (this.audioElement == undefined) {
            if (this.sourceArray == undefined || this.sourceArray.length == 0) return;
            this.setSource(this.sourceArray[this.currentlyPlaying]);
        }
        if (this.channelNr >= 100) {
            if (this.settings.playbackRate.rate == undefined) this.settings.playbackRate.rate = 1;
            if (game.user.isGM) this.setPlaybackRate(this.settings.playbackRate);

            if (this.mixer.mixer.mixerApp != undefined && this.mixer.mixer.mixerApp.rendered) {
                const color = (this.settings.repeat.repeat == 'single' || this.settings.repeat.repeat == 'all') ? 'green' : 'black';
                const elmnt = document.getElementById(`sbButton-${this.channelNr-100}`);
                elmnt.style.borderColor = color;
                elmnt.style.boxShadow = (color == 'green') ? "0 0 10px green" : "";
            }

            this.randomizeVolume();
        }
        else
            this.setPlaybackRate();
            let timing = this.settings.timing;
            if (timing == undefined)
                timing = {
                    startTime: 0,
                    stopTime: 0,
                    skipFirstTiming: false,
                    fadeIn: 0,
                    fadeOut: 0,
                    skipFirstFade: false
                }
        if (this.paused == false && (timing.skipFirstTiming == false || this.firstLoop == false)) this.audioElement.currentTime = timing.startTime;
        if (timing.fadeIn > 0  && (timing.skipFirstFade == false || this.firstLoop == false)) {
            if (this.fadeStarted == false) this.fade(0,this.settings.volume,timing.fadeIn)
        }
        this.firstLoop = false;
        if (currentTime != undefined) this.audioElement.currentTime = currentTime;
        if (this.context.state != 'running') return;

        let playPromise = this.audioElement.play();

        if (playPromise !== undefined) {
            playPromise.then(_ => {
                
            })
            .catch(error => {
              // Auto-play was prevented
            });
          }
          this.playing = true;
          this.paused = false;
  
          if (this.mixer.mixerApp != undefined && this.mixer.mixerApp.rendered) {
              document.getElementById(`playSound-${this.channelNr}`).innerHTML = `<i class="fas fa-stop"></i>`;
          }

        
    }

    pause() {
        if (this.audioElement == undefined || this.paused == true || this.playing == false) return;
        this.audioElement.pause();
        this.paused = true;
    }
    
    stop(next = true) {
        this.firstLoop = true;
        if (this.audioElement == undefined || (this.playing == false && this.paused == false)) return
        this.audioElement.pause();
        this.audioElement.currentTime = 0;
        this.playing = false;
        this.paused = false;
        if (next) this.next();
        if (this.channelNr >= 100 && this.mixer.mixer.mixerApp != undefined && this.mixer.mixer.mixerApp.rendered) {
            const color = (this.settings.repeat.repeat == 'single' || this.settings.repeat.repeat == 'all') ? 'yellow' : 'black';
            const elmnt = document.getElementById(`sbButton-${this.channelNr-100}`);
            elmnt.style.borderColor = color;
            elmnt.style.boxShadow = (color == 'yellow') ? "0 0 10px yellow" : "";
        }
        if (this.mixer.mixerApp != undefined && this.mixer.mixerApp.rendered) {
            document.getElementById(`playSound-${this.channelNr}`).innerHTML = `<i class="fas fa-play"></i>`;
        }
    }

    next(playNr = undefined) {
        if (this.sourceArray == undefined || this.sourceArray.length == 0) return;
        //this.currentlyPlaying++;
        if (playNr == undefined) this.currentlyPlaying++;
        else this.currentlyPlaying = playNr;
        if (this.currentlyPlaying > this.sourceArray.length - 1) this.currentlyPlaying = 0;
        this.setSource(this.sourceArray[this.currentlyPlaying]);
        
        if (game.user.isGM) {
            const payload = {
              "msgType": "next",
              "channel": this.channelNr,
              "currentlyPlaying": this.currentlyPlaying,
              "playing": this.playing
            };
            game.socket.emit(`module.soundscape`, payload);
            Hooks.call(moduleName,payload);
        }
    }

    previous() {
        if (this.sourceArray.length == 0) return;
        this.currentlyPlaying--;
        if (this.currentlyPlaying < 0) this.currentlyPlaying = this.sourceArray.length - 1;
        this.setSource(this.sourceArray[this.currentlyPlaying]);
        if (game.user.isGM) {
            const payload = {
              "msgType": "previous",
              "channel": this.channelNr,
              "currentlyPlaying": this.currentlyPlaying,
              "playing": this.playing
            };
            game.socket.emit(`module.soundscape`, payload);
            Hooks.call(moduleName,payload);
        }
    }

    restart() {
        if (this.audioElement == undefined) return;
        this.audioElement.currentTime = 0;
        if (game.user.isGM) {
            const payload = {
              "msgType": "restart",
              "channel": this.channelNr,
              "currentlyPlaying": this.currentlyPlaying,
              "playing": this.playing
            };
            game.socket.emit(`module.soundscape`, payload);
            Hooks.call(moduleName,payload);
        }
    }

    setPlaybackRate(playbackRate=this.settings.playbackRate) {
        if (this.audioElement == undefined) return;
        
        if (playbackRate.random != undefined && playbackRate.random != 0) {
            playbackRate.rate += (Math.random()-0.5)*playbackRate.random; 
        }
        if (playbackRate.rate < 0.25) playbackRate.rate = 0.25;
        if (playbackRate.rate > 4) playbackRate.rate = 4;

        this.settings.playbackRate = playbackRate;
        if (game.user.isGM) {
            const payload = {
              "msgType": "setPlaybackRate",
              "channelNr": this.channelNr,
              playbackRate
            };
            game.socket.emit(`module.soundscape`, payload);
            Hooks.call(moduleName,payload);
        }
        this.audioElement.playbackRate = playbackRate.rate;
        this.audioElement.preservesPitch = playbackRate.preservePitch;
    }

    setVolume(volume=this.settings.volume,save=true,solo=false) {
        if (game.user.isGM) {
            const payload = {
              "msgType": "setVolume",
              "channelNr": this.channelNr,
              volume,
              save
            };
            game.socket.emit(`module.soundscape`, payload);
            if (solo == false) Hooks.call(moduleName,payload);
        }
        if (this.settings.mute) volume = 0;
        else if (save) this.settings.volume = volume;
        if (this.effects.gain != undefined)
            this.effects.gain.set(volume);
    }

    setPan(pan) {
        this.settings.pan = pan;
        if (game.user.isGM) {
            const payload = {
              "msgType": "setPan",
              "channelNr": this.channelNr,
              pan
            };
            game.socket.emit(`module.soundscape`, payload);
            Hooks.call(moduleName,payload);
        }
        this.effects.pan.set(pan);
    }

    setMute(mute){
        if (game.user.isGM) {
            const payload = {
              "msgType": "setMute",
              "channelNr": this.channelNr,
              mute
            };
            game.socket.emit(`module.soundscape`, payload);
            Hooks.call(moduleName,payload);
        }
        let volume = mute ? 0 : this.settings.volume;
        this.effects.gain.set(volume);
        this.settings.mute = mute;
        
        let channel = this.master ? 'master' : this.channelNr + 1;
        const msg = {
            module: 'Soundscape',
            channel: channel,
            mode: 'setMute',
            mute: mute,
            solo: this.settings.solo,
            link: this.settings.link
        }
        Hooks.call("Soundscape",msg);
    }

    getMute() {
        return this.settings.mute;
    }

    setSolo(solo) {
        if (game.user.isGM) {
            const payload = {
              "msgType": "setSolo",
              "channelNr": this.channelNr,
              solo
            };
            game.socket.emit(`module.soundscape`, payload);
            Hooks.call(moduleName,payload);
        }
        this.settings.solo = solo;
    }

    getSolo() {
        return this.settings.solo;
    }

    setLink(link) {
        this.settings.link = link;

        if (game.user.isGM) {
            const payload = {
              "msgType": "setLink",
              "channelNr": this.channelNr,
              link
            };
            Hooks.call(moduleName,payload);
        }
    }

    getLink() {
        return this.settings.link;
    }

    renderConfig() {
        let soundConfig = new SoundConfig();
        soundConfig.setData(this, this.mixer.currentSoundscape);
        soundConfig.render(true);
    }

    renderFxConfig() {
        let fxConfig = new FXConfig();
        fxConfig.setData(this,this.mixer);
        fxConfig.render(true);
    }

    configureConnections() {
        this.node.disconnect();
        if (this.channelNr >= 100) 
            this.node.connect(this.effects.gain.node).connect(this.mixer.master.effects.gain.node).connect(this.mixer.mixer.master.effects.interfaceGain.node).connect(this.context.destination);
        else
            this.node.connect(this.effects.gain.node).connect(this.effects.eq.gain).connect(this.effects.pan.node).connect(this.mixer.master.effects.gain.node).connect(this.mixer.master.effects.interfaceGain.node).connect(this.context.destination);
    }

    setSource(source, stop = false, forcePlay = false) {
        if (source == undefined) return;
        const wasPlaying = this.playing;
        if (this.playing) this.stop(false);
        this.soundData.source = source;
        this.audioElement = document.createElement('audio')
        this.audioElement.src = source;
        this.source = source;

        this.audioElement.volume = 1;

        this.node = this.context.createMediaElementSource(this.audioElement);
        
        //this.node.connect(this.context.destination);
        this.configureConnections();
        this.loaded = true;
        
        if ((wasPlaying && stop == false) || forcePlay) this.play();

        let parent = this;
        this.audioElement.addEventListener('loadeddata', function() {
            parent.duration = this.duration;
        });
  
        this.audioElement.addEventListener('timeupdate', function() {
            if (parent.context.state != 'running') return;
            
            let timing = parent.settings.timing;
            if (timing == undefined)
                timing = {
                    startTime: 0,
                    stopTime: 0,
                    fadeIn: 0,
                    fadeout: 0
                }
            let repeat = parent.settings.repeat;
            if (repeat.minDelay == undefined) {
                repeat = {
                    repeat: repeat,
                    minDelay: 0,
                    maxDelay: 0
                }
            }
            let delayTime = repeat.minDelay;
            if (delayTime == undefined) delayTime = 0;
            if (repeat.maxDelay != undefined && repeat.maxDelay > repeat.minDelay) {
                delayTime = Math.random() * (repeat.maxDelay - repeat.minDelay) * 1000;
            }

            if (parent.playing && parent.audioElement.paused) {
                if (repeat.repeat == 'none') {
                    parent.stop();
                }
                else if (repeat.repeat == 'single') {
                    parent.randomizeVolume();
                   
                    setTimeout(function(){
                        parent.audioElement.currentTime = timing.startTime;
                        if (parent.playing) {
                            let playPromise = parent.audioElement.play();

                            if (playPromise !== undefined) {
                                playPromise.then(_ => {
                                    
                                })
                                .catch(error => {
                                // Auto-play was prevented
                                });
                            }
                        }
                    },delayTime)
                }
                else if (repeat.repeat == 'all') 
                    parent.randomizeVolume();
                    setTimeout(function(){
                        parent.next();
                    },delayTime)
                
            }
            if (timing.stopTime > 0 && this.currentTime >= timing.stopTime && parent.fadeStarted == false) {
                if (repeat.repeat == 'none') parent.stop();
                else if (repeat.repeat == 'single') {
                    if (timing.fadeIn > 0 && parent.fadeStarted == false) parent.fade(0,parent.settings.volume,timing.fadeIn)
                    parent.audioElement.currentTime = timing.startTime;
                    
                }
                else if (repeat.repeat == 'all') parent.next();
            }
            
            if (timing.fadeOut > 0 && this.currentTime + timing.fadeOut >= timing.stopTime) {
                if (parent.fadeStarted == false) parent.fade(parent.settings.volume,0,timing.fadeIn)
            }
        });
    }

    fade(start,end,time) {
        this.audioElement.volume = start;
        this.fadeStarted = true;
        const stepSize = (end-start)/(time*50);
        let volume = start;
        this.audioElement.volume = volume;
        let counter = 0;
        let parent = this;
        let fade = setInterval(function(){
            volume += stepSize;
            counter++;
            parent.audioElement.volume = volume;
            
            if (counter == time*50-1) {
                parent.audioElement.volume = end;
                parent.fadeStarted = false;
                clearInterval(fade);
            }
        },20)
    }

    async randomizeVolume() {
        let volume = this.settings.volume;
        if (this.settings.randomizeVolume != undefined && this.settings.randomizeVolume > 0) {
            volume += (Math.random()-0.5)*this.settings.randomizeVolume;
            if (volume < 0) volume = 0;
            if (volume > 1.25) volume = 1.25;
        }
        
        if (this.effects.gain != undefined)
            await this.effects.gain.set(volume);
    }
}