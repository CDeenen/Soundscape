import {Delay} from "./effects/delay.js"
import {Gain} from "./effects/gain.js"
import {Pan} from "./effects/pan.js"
import {EQ} from "./effects/eq.js"
import { PlaybackRate } from "./effects/playbackRate.js";
import {moduleName} from "../soundscape.js"
import {Reverb} from "./effects/reverb.js"

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
            this.preloadSound(config.soundData.source);
       }
       else {
            this.effects = {
                gain: new Gain(this.volume/100),
                interfaceGain: new Gain(game.settings.get(moduleName,'volume')),
                soundboardGain: new Gain(game.settings.get(moduleName,'soundscapes')[this.mixer.currentSoundscape].soundboardGain/100)
            }
       }
    }

    async preloadSound(source) {
        this.loaded = false;
        this.mixer.loadedSounds[this.settings.channel] = false;
        if (source == undefined || source == "") {
            //console.log("No sound to preload");
            return;
        }
       // console.log("preloading sound",source)
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
        
        //let parent = this;
        if(this.soundNode.loaded == false) await this.soundNode.load().then(()=>{
            this.loaded = this.soundNode.loaded;
            this.mixer.loadedSounds[this.settings.channel] = true;
        });
        
        //console.log('sound loaded',this);
        

        this.loadEffects();
        

        this.soundNode.on('stop',()=>{
            this.fadeOutStarted = false;
            if (this.forceStop == false && this.settings.repeat) {
                const startTime = this.settings.soundData.startTime;
                const offset = (startTime == false || startTime == undefined) ? 0 : startTime;
                this.effects.gain.node.gain.setValueAtTime(0, game.audio.context.currentTime);
                this.soundNode.play({volume:1,offset:offset});
                
            }
            else {
                clearInterval(this.timer);
                this.timer = undefined;
                this.forceStop = false;
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
                this.effects.gain.node.gain.linearRampToValueAtTime(this.effects.gain.gain,game.audio.context.currentTime+fadeIn);
            }
            else {
                this.effects.gain.node.gain.setValueAtTime(this.effects.gain.gain, game.audio.context.currentTime);
            }
        });
        
        if (this.master == false && $('#soundscape_mixer')[0] != undefined) {
            document.getElementById(`playSound-${this.settings.channel}`).disabled = '';
        }
            
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
            //const offset = this.settings.soundData.startTime;
            this.soundNode.play({volume:1,offset:offset});

            let parent = this;
            this.timer = setInterval(function(){
                const current = (parent.soundNode.context.currentTime - parent.startTime) ;
                const stopTime = parent.settings.soundData.stopTime;
                if (current >= stopTime) 
                    parent.soundNode.stop()

                const fadeOut = parent.settings.soundData.fade.fadeOut;
                if (fadeOut != 0 && current >= stopTime - fadeOut) {
                    if (current >= stopTime)
                        parent.fadeOutStarted = false;
                    else if (parent.fadeOutStarted == false) {
                        parent.fadeOutStarted = true;
                        parent.effects.gain.node.gain.linearRampToValueAtTime(0,game.audio.context.currentTime+fadeOut);
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
        const effectSettings = this.settings.effects;

        //let eqSettings = effectSettings.equalizer.lowPass;
        //this.effects.eq.setAll('lowPass',eqSettings.enable,eqSettings.frequency,eqSettings.q);
        this.effects.eq.setEnable('lowPass',this.effects.eq.settings.lowPass.enable)
        this.effects.eq.setEnable('highPass',this.effects.eq.settings.highPass.enable)
        this.effects.eq.setEnable('peaking1',this.effects.eq.settings.peaking1.enable)
        this.effects.eq.setEnable('peaking2',this.effects.eq.settings.peaking2.enable)
        this.effects.delay.setEnable(this.effects.delay.enable)
        this.effects.playbackRate.set(this.effects.playbackRate.rate)

    }

    loadEffects() {
        if (this.master) return;
        //this.effects.eq.settings.highPass.enable = (this.settings.effects?.equalizer?.highpass?.enable == undefined) ? false : this.settings.effects.equalizer.highPass.enable;
        //this.effects.eq.settings.lowPass.enable = (this.settings.effects?.equalizer?.lowpass?.enable == undefined) ? false : this.settings.effects.equalizer.lowPass.enable;
        //this.effects.eq.settings.peaking1.enable = (this.settings.effects?.equalizer?.peaking1?.enable == undefined) ? false : this.settings.effects.equalizer.peaking1.enable;
        //this.effects.eq.settings.peaking2.enable = (this.settings.effects?.equalizer?.peaking2?.enable == undefined) ? false : this.settings.effects.equalizer.peaking2.enable;
    }
}