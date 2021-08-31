import {moduleName} from "../../soundscape.js";
import {Gain} from "../Channels/Effects/gain.js";
import {Channel} from "../Channels/channel.js";

export class Soundboard {
    soundboardSize = 25;
    channels = [];
    volume = 100;


    constructor(mixer) {
        this.mixer = mixer;
        this.audioCtx = mixer.audioCtx;
        this.master = new Channel(this,"master");
        for (let i=0; i<this.soundboardSize; i++) {
            this.channels.push(new Channel(this,100+i));
        }
    }

    configure(settings) {
        this.stopAll();
        this.master.setVolume(settings.soundboardGain);
        for (let i=0; i<this.soundboardSize; i++) {
            const channelSettings = settings.soundboard[i];
            
            this.channels[i].setSbData(channelSettings);
        }
        const payload = {
            "msgType": "setSoundboardVolume",
            "volume": settings.soundboardGain
          };
          game.socket.emit(`module.soundscape`, payload);
          Hooks.call(moduleName,payload);
    }

    configureSingle(channelNr,settings) {
        this.channels[channelNr].setSbData(settings);
    }

    playSound(soundboardNr) {
        this.channels[soundboardNr].next();

        if (game.user.isGM) {
            const payload = {
              "msgType": "playSoundboard",
              channel: soundboardNr
            };
            game.socket.emit(`module.soundscape`, payload);
            Hooks.call(moduleName,payload);
        }

        const repeat = this.channels[soundboardNr].settings.repeat;
        if (repeat.repeat == 'single' || repeat.repeat == 'all') {
            if (this.channels[soundboardNr].playing) {
                this.channels[soundboardNr].stop();
                return;
            }
        }
        this.channels[soundboardNr].play();
        
    }

    stopAll() {
        if (game.user.isGM) {
            const payload = {
              "msgType": "stopAllSoundboard"
            };
            game.socket.emit(`module.soundscape`, payload);
            Hooks.call(moduleName,payload);
        }
        for (let i=0; i<this.soundboardSize; i++) {
            this.channels[i].stop();
        }
    }

    setVolume(volume) {
        this.volume = volume;
        this.master.setVolume(volume);
        if (game.user.isGM) {
            const payload = {
              "msgType": "setSoundboardVolume",
              "volume": volume
            };
            game.socket.emit(`module.soundscape`, payload);
            Hooks.call(moduleName,payload);
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
        this.configureSingle(sourceId,soundboardSettings[sourceId]);
        this.configureSingle(targetId,soundboardSettings[targetId]);
        await game.settings.set(moduleName,'soundscapes',settings);
        this.mixer.renderApp(true);
    }

    async copySounds(sourceId,targetId) {
        let settings = game.settings.get(moduleName,'soundscapes');
        let soundboardSettings = settings[this.mixer.currentSoundscape].soundboard;
        soundboardSettings[targetId] = soundboardSettings[sourceId];
        settings[this.mixer.currentSoundscape].soundboard = soundboardSettings;
        this.configureSingle(targetId,soundboardSettings[targetId]);
        await game.settings.set(moduleName,'soundscapes',settings);
        this.mixer.renderApp(true);
    }

    async deleteSound(sourceId) {
        let settings = game.settings.get(moduleName,'soundscapes');
        settings[this.mixer.currentSoundscape].soundboard[sourceId] = this.newChannel(sourceId);
        this.configureSingle(sourceId,this.newChannel(sourceId));
        await game.settings.set(moduleName,'soundscapes',settings);
        this.mixer.renderApp(true);
    }

    async newData(targetId,data) {
        let settings = game.settings.get(moduleName,'soundscapes');
        let channelSettings = settings[this.mixer.currentSoundscape].soundboard[targetId];
        if (channelSettings == null) channelSettings = this.newChannel(targetId);
        if (data.type == 'playlist_multi') {
            const plName = game.playlists.get(data.playlist).name;
            if (channelSettings.name == undefined || channelSettings.name == "") channelSettings.name = plName;
            channelSettings.soundData.playlistName = plName;
            channelSettings.soundData.soundSelect = data.type;
        }
        else if (data.type == 'playlist_single') {
            const pl = game.playlists.get(data.playlist);
            if (pl == undefined) return;
            const plName = pl.name;
            const soundName = pl.sounds.get(data.sound).name;
            if (channelSettings.name == undefined || channelSettings.name == "") channelSettings.name = soundName;
            channelSettings.soundData.playlistName = plName;
            channelSettings.soundData.soundName = soundName;
            channelSettings.soundData.soundSelect = data.type;
        }
        else if (data.type == 'filepicker_single' || data.type == 'filepicker_folder') {
            channelSettings.soundData.source = data.source;
            if (channelSettings.name == undefined || channelSettings.name == "") channelSettings.name = data.name;
            channelSettings.soundData.soundSelect = data.type;
        }

        settings[this.mixer.currentSoundscape].soundboard[targetId] = channelSettings;

        this.configureSingle(targetId,channelSettings);
        await game.settings.set(moduleName,'soundscapes',settings);
        this.mixer.renderApp(true); 
    }

    newChannel(channelNr) {
        return {
            channel: 100+parseInt(channelNr),
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
            repeat: 'none',
            randomize: false,
            imageSrc: ''
        }
    }
}