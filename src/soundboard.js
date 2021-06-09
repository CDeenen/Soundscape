import {moduleName} from "../soundscape.js";
import {Gain} from "./effects/gain.js";
import {createSoundArray} from "./helpers/helpers.js";

export class Soundboard {
    constructor(config,volume,mixer) {
        this.settings = config;
        this.mixer = mixer;
        this.playing = [];                                  //stores the currently playing sounds
        this.volume = volume;
        this.soundArray = [];                               //stores the sound sources
        this.currentPlaying = [];                           //stores the number of the currently playing sound within the soundarray
        this.gain = new Gain(volume/100)
    }

    refresh() {
        this.stopAll();
        let settings = game.settings.get(moduleName,'soundscapes')[this.mixer.currentSoundscape];
        this.settings = settings.soundboard;
        this.volume = settings.soundboardGain;
        this.setVolume(this.volume);
        this.soundArray = [];
    }

    async playSound(soundNr) {
        let settings = this.settings[soundNr]
        if (settings == undefined) return;
        if (this.soundArray[soundNr] ==  undefined) {
            const soundData = {
                playlistName: settings.playlistName,
                soundName: settings.soundName,
                soundSelect: settings.soundSelect,
                source: settings.source,
                randomize: settings.randomize
            }
            const array = await createSoundArray(soundData);
            this.soundArray[soundNr] = array;
            this.currentPlaying[soundNr] = 0;
        }
        if (this.currentPlaying[soundNr] == undefined) this.currentPlaying[soundNr] = 0;

        const thisArray = this.soundArray[soundNr]
        const source = thisArray[this.currentPlaying[soundNr]];
        if (source == undefined || source == '' || source == null) return;
        
        this.currentPlaying[soundNr]++;
        if (this.currentPlaying[soundNr] > thisArray.length-1) this.currentPlaying[soundNr] = 0;
        
        await this.playing.push({audio:new Audio(source),source: undefined});
        const len = this.playing.length-1;
        
        this.playing[len].source = game.audio.context.createMediaElementSource(this.playing[len].audio);
        
        this.playing[len].source.mediaElement.volume = settings.volume/100;
        let playbackSpeed = settings.playbackSpeed;
        if (settings.playbackRandom != undefined && settings.playbackRandom != 0) {
            playbackSpeed += (Math.random()-0.5)*settings.playbackRandom; 
        }
        this.playing[len].source.mediaElement.playbackRate = playbackSpeed;

        if (game.user.isGM) {
            const payload = {
                "msgType": "playSoundboard",
                "src": source,
                "volume": settings.volume/100,
                "playbackSpeed": playbackSpeed
            };
            game.socket.emit(`module.Soundscape`, payload);
        }
        
        this.playing[len].source.connect(this.gain.node).connect(this.mixer.master.effects.interfaceGain.node).connect(game.audio.context.destination);
        this.playing[len].audio.play({volume:settings.volume/100});
    }

    stopAll() {
        for (let i=0; i<this.playing.length; i++) {
            this.playing[i].audio.pause();
        }
        this.playing = [];
    }

    setVolume(volume) {
        this.gain.set(volume/100);
        this.volume = volume;

        if (game.user.isGM) {
            const payload = {
              "msgType": "setSoundboardVolume",
              "volume": volume/100
            };
            game.socket.emit(`module.Soundscape`, payload);
            let settings = game.settings.get(moduleName,'soundscapes');
            settings[this.mixer.currentSoundscape].soundboardGain = volume;
            game.settings.set(moduleName,'soundscapes',settings);
        }
    }

    async swapSounds(sourceId,targetId) {
        let settings = game.settings.get(moduleName,'soundscapes');
        let soundboardSettings = settings[this.mixer.currentSoundscape].soundboard;
        const temp = soundboardSettings[sourceId];
        soundboardSettings[sourceId] = soundboardSettings[targetId];
        soundboardSettings[targetId] = temp;
        settings[this.mixer.currentSoundscape].soundboard = soundboardSettings;
        await game.settings.set(moduleName,'soundscapes',settings);
        this.mixer.refresh();
    }

    async copySounds(sourceId,targetId) {
        let settings = game.settings.get(moduleName,'soundscapes');
        let soundboardSettings = settings[this.mixer.currentSoundscape].soundboard;
        soundboardSettings[targetId] = soundboardSettings[sourceId];
        settings[this.mixer.currentSoundscape].soundboard = soundboardSettings;
        await game.settings.set(moduleName,'soundscapes',settings);
        this.mixer.refresh();
    }

    async deleteSound(sourceId) {
        let settings = game.settings.get(moduleName,'soundscapes');
        let soundboardSettings = settings[this.mixer.currentSoundscape].soundboard;
        soundboardSettings[sourceId] = undefined;
        settings[this.mixer.currentSoundscape].soundboard = soundboardSettings;
        await game.settings.set(moduleName,'soundscapes',settings);
        this.mixer.refresh();
    }
}