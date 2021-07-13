import {moduleName} from "../../soundscape.js";
import {helpMenuSoundboardConfig} from "../Help/helpMenus.js";

export class soundboardConfig extends FormApplication {
    constructor(data, options) {
        super(data, options);
        this.mixer;
        this.soundNr;
        this.currentSoundscape;
        this.parent;
        this.playlistName;
        this.soundName;
    }

    setMixer(mixer,soundNr,parent) {
        this.mixer = mixer;
        this.soundNr = soundNr;
        this.currentSoundscape = mixer.currentSoundscape;
        this.parent = parent;
    }
  
    /**
     * Default Options for this FormApplication
     */
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            id: "soundscape_soundboardConfig",
            title: "Soundscape: " + game.i18n.localize("Soundscape.SoundboardConfig"),
            template: "./modules/Soundscape/src/Soundboard/soundboardConfig.html",
            width: "500px"
        });
    }
  
    /**
     * Provide data to the template
     */
    async getData() {
        let settings = game.settings.get(moduleName,'soundscapes')[this.currentSoundscape].soundboard[this.soundNr];

        this.playlistName = settings.soundData.playlistName;
        this.soundName = settings.soundData.soundName;

        let playlists = [{name:game.i18n.localize("Soundscape.None"),id:'none'}];
        let sounds = [{name:game.i18n.localize("Soundscape.None"),id:'none'}];

        for (let p of game.playlists) {
            playlists.push({name:p.name,id:p.id});
            if (p.name == settings.soundData.playlistName)
                for (let s of p.sounds.contents) 
                    sounds.push({name:s.name,id:s.id});
        }

        let pl, snd;
        if (this.playlistName != undefined && this.playlistName != "")                pl = game.playlists.getName(this.playlistName);
        if (this.soundName != undefined && this.soundName != "" && pl != undefined)   snd = pl.sounds.getName(this.soundName);
        const playlistId = pl != undefined ? pl.id : '';
        const soundId = snd != undefined ? snd.id : '';
        return {
            soundNr: parseInt(this.soundNr)+1,
            volume: settings.volume*100,
            playlists,
            sounds,
            selectedSound: soundId,
            selectedPlaylist: playlistId,
            settings,
            randomize: settings.randomize ? 'checked' : ''
        } 
    }
  
    /**
     * Update on form submit
     * @param {*} event 
     * @param {*} formData 
     */
    async _updateObject(event, formData) {
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

        const setting = {
            channel: 100+parseInt(this.soundNr),
            soundData: {
                soundSelect: formData.soundSelect,
                playlistName: playlistName,
                soundName: soundName,
                source: source  
            },
            playbackRate: {
                rate: formData.speed,
                preservePitch: 1,
                random: formData.randSpeed
            },
            name: formData.name,
            volume: formData.volume/100,
            repeat: 'none',
            randomize: formData.randomize,
            imageSrc: formData.img
        }
        this.mixer.soundboard.configureSingle(this.soundNr,setting);

        let settings = game.settings.get(moduleName,'soundscapes');
        settings[this.currentSoundscape].soundboard[this.soundNr] = setting;
        
        await game.settings.set(moduleName,'soundscapes',settings)
        this.mixer.renderApp(true);
    }
  
    activateListeners(html) {
        super.activateListeners(html);

        setTimeout(function() {
            document.getElementById('soundscape_soundboardConfigHelp').addEventListener("click", (event) => {
                let dialog = new helpMenuSoundboardConfig();
                dialog.render(true);
            })
        },100)

        const playlist = html.find("select[name=playlistId]");
        const volumeSlider = html.find("input[name=volume]");
        const volumeNumber = html.find("input[name=volumeNumber]");
        const playbackSpeedSlider = html.find("input[name=speed]");
        const playbackSpeedNumber = html.find("input[name=speedNumber]");
        const playbackSpeedRandomSlider = html.find("input[name=randSpeed]");
        const playbackSpeedRandomNumber = html.find("input[name=randSpeedNumber]");

        volumeSlider.on("input change", event => {
            volumeNumber[0].value = event.currentTarget.value;
        }) 

        volumeNumber.on("change", event => {
            volumeSlider[0].value = event.currentTarget.value;
        }) 

        playbackSpeedSlider.on("input change", event => {
            playbackSpeedNumber[0].value = event.currentTarget.value;
        }) 

        playbackSpeedNumber.on("change", event => {
            playbackSpeedSlider[0].value = event.currentTarget.value;
        }) 

        playbackSpeedRandomSlider.on("input change", event => {
            playbackSpeedRandomNumber[0].value = event.currentTarget.value;
        }) 

        playbackSpeedRandomNumber.on("change", event => {
            playbackSpeedRandomSlider[0].value = event.currentTarget.value;
        }) 
        
        playlist.on("change", event => {
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
        });
    }
}