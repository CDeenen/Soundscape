import {moduleName} from "../../soundscape.js";
import {getTimeStamp, getSeconds} from "../Misc/helpers.js";
import {helpMenuSoundConfig} from "../Help/helpMenus.js";

export class SoundConfig extends FormApplication {
    
    constructor(data, options) {
        super(data, options);
        this.playlistName;
        this.soundName;
        this.mixer;
        this.channelNumber;
        this.currentSoundscape;
        this.channel;
    }
  
    /**
     * Default Options for this FormApplication
     */
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            id: "soundscape_soundConfig",
            title: "Soundscape: "+game.i18n.localize("Soundscape.SoundConfig"),
            template: "./modules/soundscape/src/Channels/soundConfig.html"
        });
    }

    setData(channel,currentSoundscape) {
        this.channel = channel;
        this.mixer = channel.mixer;
        this.channelNumber = channel.channelNr;
        this.currentSoundscape = currentSoundscape;
    }
  
    /**
     * Provide data to the template
     */
    getData() {
        //Get the settings
        let channel = game.settings.get(moduleName,'soundscapes')[this.currentSoundscape].channels[this.channelNumber];
        let soundData = channel.soundData;
        
        this.playlistName = soundData.playlistName;
        this.soundName = soundData.soundName;

        let playlists = [{name:game.i18n.localize("Soundscape.None"),id:'none'}];
        let sounds = [{name:game.i18n.localize("Soundscape.None"),id:'none'}];

        for (let p of game.playlists) {
            playlists.push({name:p.name,id:p.id});
            if (p.name == soundData.playlistName)
                for (let s of p.sounds.contents) 
                    sounds.push({name:s.name,id:s.id});
        }

        let pl, snd;
        if (soundData.playlistName != undefined && soundData.playlistName != "")                pl = game.playlists.getName(soundData.playlistName);
        if (soundData.soundName != undefined && soundData.soundName != "" && pl != undefined)   snd = pl.sounds.getName(soundData.soundName);
        const playlistId = pl != undefined ? pl.id : '';
        const soundId = snd != undefined ? snd.id : '';
        
        return {
            channel,
            channelNumber: channel.channel + 1,
            playlists,
            sounds,
            selectedSound: soundId,
            selectedPlaylist: playlistId,

            start: getTimeStamp(channel.settings.timing.startTime),
            stop: getTimeStamp(channel.settings.timing.stopTime),
            fadeIn: getTimeStamp(channel.settings.timing.fadeIn),
            fadeOut: getTimeStamp(channel.settings.timing.fadeOut),
            randomize: channel.settings.randomize ? 'checked' : ''
        } 
    }
  
    /**
     * Update on form submit
     * @param {*} event 
     * @param {*} formData 
     */
    async _updateObject(event, formData) {
        let settings = game.settings.get(moduleName,'soundscapes');
        let channelData = settings[this.currentSoundscape].channels[this.channelNumber];
        let source = '';
        let playlistName = '';
        let soundName = '';
        if (formData.soundSelect == 'filepicker_single') {
            source = formData.src;
        }
        else if (formData.soundSelect == 'filepicker_folder') {
            source = formData.folderSrc;
        }
        else if (formData.soundSelect == 'playlist_single') {
            const playlist = game.playlists.get(formData.playlistId);
            if (playlist != undefined) {
                playlistName = playlist.name;
                const sound = playlist.sounds.get(formData.soundId);
                if (sound != undefined) soundName = sound.name;
            }
        }
        else if (formData.soundSelect == 'playlist_multi') {
            const playlist = game.playlists.get(formData.playlistId);
            if (playlist != undefined) playlistName = playlist.name;
        }

        channelData.settings.repeat = formData.repeat;
        channelData.settings.name = formData.name;
        channelData.settings.randomize = formData.randomize;
        channelData.settings.timing = {
            startTime: getSeconds(formData.start),
            stopTime: getSeconds(formData.stop),
            fadeIn: getSeconds(formData.fadeIn),
            fadeOut: getSeconds(formData.fadeOut)
        }
        channelData.soundData = {
            source,
            soundSelect: formData.soundSelect,
            playlistName,
            soundName,
        }
        
        await game.settings.set(moduleName,'soundscapes',settings);
        this.channel.stop();
        this.channel.setData(channelData);
        this.mixer.renderApp(true);
    }
  
    activateListeners(html) {
        super.activateListeners(html);

        setTimeout(function() {
            document.getElementById('soundscape_soundConfigHelp').addEventListener("click", (event) => {
                let dialog = new helpMenuSoundConfig();
                dialog.render(true);
            })
        },100)

        const playlist = html.find("select[name=playlistId]");
        const sound = html.find("select[name=soundId]");
        const filePicker = html.find("input[name=src]");

        playlist.on('change',(event)=>{
            html.find("input[name=duration]")[0].value="";
            let playlistId = 'none';
            
            if (event.target.value==undefined || event.target.value == 'none') this.playlistName = '';
            else {
                playlistId = event.target.value;
                this.playlistName = game.playlists.get(playlistId).name;
                let soundSelect = html.find("select[name=soundId]")[0];
                soundSelect.options.length=0;
                let optionNone = document.createElement('option');
                optionNone.value = "";
                optionNone.innerHTML = game.i18n.localize("Soundscape.None");
                soundSelect.appendChild(optionNone);

                if (playlistId != "none") {
                    const pl = game.playlists.get(playlistId)
                    if (pl == undefined) return;
                    for (let sound of pl.sounds.contents) {
                        let newOption = document.createElement('option');
                        newOption.value = sound.id;
                        newOption.innerHTML = sound.name;
                        soundSelect.appendChild(newOption);
                    } 
                }
            }
        })

        filePicker.on('change',(event)=>{
            const src = event.currentTarget.value;
            this.preloadSound(src,html);
        })

        sound.on('change',(event)=>{
            html.find("input[name=duration]")[0].value="";
            const playlist = game.playlists.getName(this.playlistName);
            if (playlist == undefined) return;
            const sound = playlist.sounds.get(event.target.value);
            if (sound == undefined) return;
            const src = sound.data.path;
            this.preloadSound(src,html);
        })
    }

    async preloadSound(src,html) {
        this.previewSound = new Sound(src)
        if (this.previewSound.loaded == false) await this.previewSound.load();
        html.find("input[name=duration]")[0].value=getTimeStamp(this.previewSound.duration);
    }
  }