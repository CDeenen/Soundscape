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
            title: "Soundscape: "+game.i18n.localize("SOUNDSCAPE.SoundConfig"),
            template: "./modules/soundscape/src/Channels/soundConfig.html",
            closeOnSubmit: false
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

        let playlists = [{name:game.i18n.localize("SOUNDSCAPE.None"),id:'none'}];
        let sounds = [{name:game.i18n.localize("SOUNDSCAPE.None"),id:'none'}];

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

        let repeat = {
            repeat: (channel.settings.repeat.repeat == undefined) ? 'none' : channel.settings.repeat.repeat,
            minDelay: (channel.settings.repeat.minDelay == undefined) ? getTimeStamp(0) : getTimeStamp(channel.settings.repeat.minDelay),
            maxDelay: (channel.settings.repeat.maxDelay == undefined) ? getTimeStamp(0) : getTimeStamp(channel.settings.repeat.maxDelay)
        }
        
        return {
            channel,
            channelNumber: channel.channel + 1,
            playlists,
            sounds,
            selectedSound: soundId,
            selectedPlaylist: playlistId,

            start: getTimeStamp(channel.settings.timing.startTime),
            stop: getTimeStamp(channel.settings.timing.stopTime),
            skipFirstTiming: (channel.settings.timing.skipFirstTiming == true) ? 'checked' : '',
            fadeIn: getTimeStamp(channel.settings.timing.fadeIn),
            fadeOut: getTimeStamp(channel.settings.timing.fadeOut),
            skipFirstFade: (channel.settings.timing.skipFirstFade == true) ? 'checked' : '',
            randomize: channel.settings.randomize ? 'checked' : '',
            repeat
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

        this.channel.stop();
        if (event.submitter.name == "delete") {
            const confirm = await Dialog.confirm({
                title: game.i18n.localize("SOUNDSCAPE.ConfirmDeleteTitle"),
                content: game.i18n.localize("SOUNDSCAPE.ConfirmDeleteContent")});
            
            if (confirm) {
                await this.channel.clear();
                channelData.settings = this.channel.settings
                channelData.soundData = this.channel.soundData
                delete channelData.sourceArray
            } else {
                return false;
            }
        }
        else if (event.submitter.name == "save") {
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

            const repeat = {
                repeat: formData.repeat,
                minDelay: getSeconds(formData.minDelay),
                maxDelay: getSeconds(formData.maxDelay),
            }

            channelData.settings.repeat = repeat;
            channelData.settings.name = formData.name;
            channelData.settings.randomize = formData.randomize;
            channelData.settings.timing = {
                startTime: getSeconds(formData.start),
                stopTime: getSeconds(formData.stop),
                skipFirstTiming: formData.skipFirstTiming,
                fadeIn: getSeconds(formData.fadeIn),
                fadeOut: getSeconds(formData.fadeOut),
                skipFirstFade: formData.skipFirstFade
            }
            channelData.soundData = {
                source,
                soundSelect: formData.soundSelect,
                playlistName,
                soundName,
            }

            this.channel.setData(channelData);
        }
        await game.settings.set(moduleName,'soundscapes',settings);
        this.mixer.renderApp(true);
        this.close()
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

        html.find("button.mtte-picker").click(ev => {
            if(!game.moulinette || !game.moulinette.applications.MoulinetteAPI) {
                return ui.notifications.warn(game.i18n.localize("SOUNDSCAPE.moulinetteNotEnabled"));
            }
            //game.moulinette.applications.MoulinetteAPI.assetPicker()
        });

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
                optionNone.innerHTML = game.i18n.localize("SOUNDSCAPE.None");
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