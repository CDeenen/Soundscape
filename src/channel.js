import {Delay} from "./effects/delay.js";
import {Gain} from "./effects/gain.js";
import {Pan} from "./effects/pan.js";
import {EQ} from "./effects/eq.js";
import {PlaybackRate} from "./effects/playbackRate.js";
import {moduleName} from "../soundscape.js";
import {createSoundArray} from "./helpers/helpers.js";

export class Channel {
    constructor(config,mixer,master=false) {
       // super(data, options);
       this.settings = config;
       this.effects = {
       }
       this.mixer = mixer;
       this.master = master;
       
       this.mute = this.settings.mute;
       this.solo = this.settings.solo;
       this.volume = config.volume;
       this.link = this.settings.link;

       this.timer;
       this.fadeOutStarted = false;
       this.forceStop = false;
       this.startTime = 0;

       this.loaded = false;
       this.previousSound;
       this.soundArray = [];
       this.currentlyPlayingNr = 0;

       let parent = this;
       setTimeout(function(){
        parent.setMute(parent.settings.mute);
        parent.setSolo(parent.settings.solo);
       },100)
       

       if (master == false) {
            
            this.effects = {
                gain: new Gain(this.settings.volume/100),
                pan: new Pan(this.settings.pan),
                fft: undefined,
                eq: new EQ(this),
                playbackRate: new PlaybackRate(this),
                delay: new Delay(this)
            }
            this.soundNode = undefined
            this.loaded = false;
            this.preloadSound();
       }
       else {
            this.effects = {
                gain: new Gain(this.volume/100),
                interfaceGain: new Gain(game.settings.get(moduleName,'volume'))
            }
       }
    }


    async preloadSound(next=false,autoplay=false) {
        if (next) document.getElementById(`playSound-${this.settings.channel}`).disabled = true;
        const soundData = this.settings.soundData;
        if (soundData.soundSelect == undefined) soundData.soundSelect == 'playlist_single';
        if (next==false) {
            this.soundArray = await createSoundArray(soundData);
            this.currentlyPlayingNr = 0;
        }
        else if (next) {
            this.currentlyPlayingNr++;
            if (this.currentlyPlayingNr > this.soundArray.length-1) this.currentlyPlayingNr = 0; 
        }

        if (this.soundArray == undefined) return;
        const source = this.soundArray[this.currentlyPlayingNr];

        if (source == undefined) return;

        this.loaded = false;
        this.mixer.loadedSounds[this.settings.channel] = false;
        if (source == undefined || source == "") {
            console.log(`No sound to preload on channel $(this.settings.channel+1)`);
            return;
        }
        console.log(`preloading sound on channel ${this.settings.channel+1}: ${source}`)
        if (game.user.isGM) {
            const payload = {
              "msgType": "preloadSound",
              "channelNr": this.settings.channel,
              source,
              settings: this.settings,
              mute: this.mute,
              solo: this.solo
            };
            game.socket.emit(`module.Soundscape`, payload);
        }
        
        this.soundNode = new Sound(source);
        
        if(this.soundNode.loaded == false) await this.soundNode.load().then(()=>{
            this.loaded = this.soundNode.loaded;
            this.mixer.loadedSounds[this.settings.channel] = true;
        });
        
        this.soundNode.on('stop',()=>{
            this.fadeOutStarted = false;
            if (this.forceStop == false && this.settings.repeat == 'single') {
                const startTime = soundData.startTime;
                const offset = (startTime == false || startTime == undefined) ? 0 : startTime;
                this.effects.gain.node.gain.setValueAtTime(0, game.audio.context.currentTime);
                this.soundNode.play({volume:1,offset:offset}); 
            }
            else if (this.forceStop == false && this.settings.repeat == 'all') {
                this.preloadSound(true,true);
            }
            else {
                clearInterval(this.timer);
                this.timer = undefined;
                this.forceStop = false;
                document.getElementById(`playSound-${this.settings.channel}`).innerHTML = `<i class="fas fa-play"></i>`;
                this.preloadSound(true);
            }

        })
        this.soundNode.on('start',()=>{
            this.fadeOutStarted = false;
            this.configureConnections();
            this.setEffects();
            const startTime = this.settings.soundData.startTime;
            const offset = (startTime == false || startTime == undefined) ? 0 : startTime;
            const fadeIn = this.settings.soundData.fade.fadeIn;
            this.startTime = this.soundNode.context.currentTime - offset;
            if (fadeIn != 0) {
                this.effects.gain.node.gain.setValueAtTime(0, game.audio.context.currentTime);
                this.effects.gain.node.gain.setTargetAtTime(this.effects.gain.gain,game.audio.context.currentTime,fadeIn/4)
                //this.effects.gain.node.gain.linearRampToValueAtTime(this.effects.gain.gain,game.audio.context.currentTime+fadeIn);
            }
            else {
                this.effects.gain.node.gain.setValueAtTime(this.effects.gain.gain, game.audio.context.currentTime);
            }
        });
        
        if (this.master == false && $('#soundscape_mixer')[0] != undefined) {
            document.getElementById(`playSound-${this.settings.channel}`).disabled = false;
        }
        if (autoplay) this.play();   
    }

    configureConnections() {
        this.soundNode.node.disconnect();
        this.soundNode.node.connect(this.effects.gain.node).connect(this.effects.eq.gain).connect(this.effects.pan.node).connect(this.mixer.master.effects.gain.node).connect(this.mixer.master.effects.interfaceGain.node).connect(this.soundNode.context.destination);
    }

    setVolume(volume=this.volume,save=true) {
        if (game.user.isGM) {
            const payload = {
              "msgType": "setVolume",
              "channelNr": this.settings.channel,
              volume,
              save
            };
            game.socket.emit(`module.Soundscape`, payload);
        }
        if (this.mute) volume = 0;
        else if (save) this.volume = volume;
        if (this.effects.gain != undefined)
            this.effects.gain.set(volume/100);
    }

    setMute(mute){
        if (game.user.isGM) {
            const payload = {
              "msgType": "setMute",
              "channelNr": this.settings.channel,
              mute
            };
            game.socket.emit(`module.Soundscape`, payload);
        }
        let volume = mute ? 0 : this.volume;
        this.effects.gain.set(volume/100);
        this.mute = mute;
        
        let channel = this.master ? 'master' : this.settings.channel + 1;
        const msg = {
            module: 'Soundscape',
            channel: channel,
            mode: 'setMute',
            mute: mute,
            solo: this.solo,
            link: this.link
        }
        Hooks.call("Soundscape",msg);
    }

    getMute() {
        return this.mute;
    }

    setSolo(solo) {
        if (game.user.isGM) {
            const payload = {
              "msgType": "setSolo",
              "channelNr": this.settings.channel,
              solo
            };
            game.socket.emit(`module.Soundscape`, payload);
        }
        this.solo = solo;

        let channel = this.master ? 'master' : this.settings.channel + 1;

        const msg = {
            module: 'Soundscape',
            channel: channel,
            mode: 'setSolo',
            mute: this.mute,
            solo: solo,
            link: this.link
        }
        Hooks.call("Soundscape",msg);
    }

    getSolo() {
        return this.solo;
    }

    setLink(link) {
        this.link = link;

        let channel = this.master ? 'master' : this.settings.channel + 1;

        const msg = {
            module: 'Soundscape',
            channel: channel,
            mode: 'setLink',
            mute: this.mute,
            solo: this.solo,
            link: link
        }
        Hooks.call("Soundscape",msg);
    }

    getLink() {
        return this.link;
    }

    setPan(pan) {
        if (game.user.isGM) {
            const payload = {
              "msgType": "setPan",
              "channelNr": this.settings.channel,
              pan
            };
            game.socket.emit(`module.Soundscape`, payload);
        }
        this.effects.pan.set(pan);
    }

    getPan() {
        return this.effects.pan.get();
    }

    play(offset = this.settings.soundData.startTime) {
        if (this.loaded) {
            this.fadeOutStarted = false;
            this.soundNode.play({volume:1,offset:offset});

            let parent = this;
            this.timer = setInterval(function(){
                const current = (parent.soundNode.context.currentTime - parent.startTime) ;
                const stopTime = parent.settings.soundData.stopTime > 0 ? parent.settings.soundData.stopTime : parent.soundNode.duration;
                if (current >= stopTime) 
                    parent.soundNode.stop()

                const fadeOut = parent.settings.soundData.fade.fadeOut;
                if (fadeOut != 0 && current >= stopTime - fadeOut) {
                    if (current >= stopTime)
                        parent.fadeOutStarted = false;
                    else if (parent.fadeOutStarted == false) {
                        parent.fadeOutStarted = true;
                        parent.effects.gain.node.gain.setTargetAtTime(0,game.audio.context.currentTime,fadeOut/4)
                    }
                }
                else
                    parent.fadeOutStarted = false;
            },100)
        }
    }

    stop(force = true) {
        this.forceStop = force;
        if (this.loaded) this.soundNode.stop();
        clearInterval(this.timer);
        this.timer = undefined;
        this.fadeOutStarted = false;
    }

    setEffects() {
        if (this.settings.effects == undefined) return;
        this.effects.eq.setEnable('lowPass',this.effects.eq.settings.lowPass.enable)
        this.effects.eq.setEnable('highPass',this.effects.eq.settings.highPass.enable)
        this.effects.eq.setEnable('peaking1',this.effects.eq.settings.peaking1.enable)
        this.effects.eq.setEnable('peaking2',this.effects.eq.settings.peaking2.enable)
        this.effects.delay.setEnable(this.effects.delay.enable)
        this.effects.playbackRate.set(this.effects.playbackRate.rate)
    }
}