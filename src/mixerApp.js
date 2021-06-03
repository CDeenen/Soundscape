import {SoundConfig} from "./soundConfig.js";
import {FXConfig} from "./effects/fxConfig.js";
import {sendWS} from "./websocket.js"
import {moduleName} from "../soundscape.js"
import {Gain} from "./effects/gain.js"

export class MixerApp extends FormApplication {
    constructor(data, options) {
        super(data, options);
        this.mixer;
        this.fxConfig;
        this.soundboardPlaying = [];
    }

    async setMixer(mixer) {
        if (this.mixer != undefined) return;
        this.mixer = mixer;
        await this.mixer.refresh(0);
    }

    rerender() {
        this.render(true);
    }
  
    /**
     * Default Options for this FormApplication
     */
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            id: "soundscape_mixer",
            title: "Soundscape: "+game.i18n.localize("Soundscape.Mixer"),
            template: "./modules/Soundscape/templates/mixer.html",
            width: "auto"
        });
    }
  
    /**
     * Provide data to the template
     */
    async getData() {
        const channels = this.mixer.channels;
        let channelData = [];
        for (let i=0; i<channels.length; i++) {
            const channelSettings = channels[i].settings;
            const playing = channels[i].soundNode?.playing ? true : false;
            const loaded = channels[i].soundNode?.loaded ? true : false;
            channelData[i] = {
                settings: channelSettings,
                channelIteration: i,
                channelNumber: i+1,
                volume: channelSettings.volume,
                pan: channelSettings.pan*25,
                muteColor: channelSettings.mute ? "rgb(255, 0, 0)" : "rgb(127, 0, 0)",
                soloColor: channelSettings.solo ? "rgb(255, 255, 0)" : "rgb(127, 127, 0)",
                linkColor: channelSettings.link ? "rgb(0, 150, 255)" : "rgb(0, 15, 255)",
                playButton: playing ? 'fas fa-stop' : 'fas fa-play',
                disabled: loaded ? '' : 'disabled'
            }
        }
        const master = this.mixer.master;
        let masterData = {
            volume: master.settings.volume,
            muteColor: master.settings.mute ? "rgb(255, 0, 0)" : "rgb(127, 0, 0)"
        } 
        const soundscapePlaying = this.mixer.playing ? true : false;
        //const soundboardSettings = game.settings.get(moduleName,'soundscapes');
        let soundboardSettings = game.settings.get(moduleName,'soundscapes')[this.mixer.currentSoundscape].soundboard;
        
        const soundboard = [];
        let iteration = 0;
        for (let i=0; i<5; i++) {
            let row = [];
            for (let j=0; j<5; j++) {
                const data = {
                    iteration,
                    name: soundboardSettings[iteration]?.name ? soundboardSettings[iteration].name : '',
                    imageSrc: soundboardSettings[iteration]?.imageSrc ? soundboardSettings[iteration].imageSrc : 'modules/Soundscape/img/transparant.png'
                }
                row.push(data);
                iteration++;
            }
            soundboard.push({row});
        }
        const soundboardEnabled = game.settings.get(moduleName,'sbEnabled')
        const mainColumnWidth = soundboardEnabled ? '49%' : '100%';
        const mainRowWidth = soundboardEnabled ? '836px' : '410px';
        const soundboardDisplay = soundboardEnabled ? '' : 'none';
        

        return {
            channels: channelData,
            master: masterData,
            playing: soundscapePlaying,
            playingIcon: soundscapePlaying ? 'fas fa-stop' : 'fas fa-play',
            name: this.mixer.name,
            soundScapeNumber: this.mixer.currentSoundscape+1,
            soundScapeIteration: this.mixer.currentSoundscape,
            loadedSounds: this.mixer.loadedSounds,
            soundboard,
            mainColumnWidth,
            mainRowWidth,
            soundboardDisplay,
            sbGain: game.settings.get(moduleName,'soundscapes')[this.mixer.currentSoundscape].soundboardGain
        } 
    }
  
    /**
     * Update on form submit
     * @param {*} event 
     * @param {*} formData 
     */
    async _updateObject(event, formData) {
  
    }
  
    activateListeners(html) {
        super.activateListeners(html);

        const prevSoundscape = html.find("button[name=prevSoundscape]")
        const nextSoundscape = html.find("button[name=nextSoundscape]")
        const soundscapeName = html.find("input[name=soundscapeName");
        const mixerConfigBtn = html.find("button[name=mixerConfig]");
        const soundboardEnable = html.find("button[name=soundboardEnable]")
        const volumeSlider = html.find("input[name=volumeSlider]");
        const volumeNumber = html.find("input[name=volumeNumber]");
        const mute = html.find("button[name=mute]");
        const solo = html.find("button[name=solo]");
        const link = html.find("button[name=link]");
        const fx = html.find("button[name=fx]");
        const config = html.find("button[name=config]");
        const play = html.find("button[name=play]");
        const playSound = html.find("button[name=playSound]");
        const soundName = html.find("input[name=name]");
        const panner = html.find("input[name=panSlider]");

        const sbButton = html.find("input[name=sbButton");
        const sbButtonLabel = html.find("p[name=sbButtonLabel]");
        const sbVolume = html.find("input[name=sbVolume]")
        const sbStopAll = html.find("button[name=stopSB");

        sbStopAll.on('click', event => {
            for (let i=0; i<this.soundboardPlaying.length; i++) {
                this.soundboardPlaying[i].audio.pause();
            }
            this.soundboardPlaying = [];
        })
        sbVolume.on('input change', (event)=>{
            const val = event.target.value;
            this.mixer.master.effects.soundboardGain.set(val/100);
            let settings = game.settings.get(moduleName,'soundscapes');
            settings[this.mixer.currentSoundscape].soundboardGain = val;
            if (game.user.isGM) {
                const payload = {
                  "msgType": "setSoundboardVolume",
                  "volume": val/100
                };
                game.socket.emit(`module.Soundscape`, payload);
            }
            game.settings.set(moduleName,'soundscapes',settings)
        })
        sbButton.on('click', async (event)=>{
            event.preventDefault();
            const id = event.target.id.replace('sbButton-','');
            const settings = game.settings.get(moduleName,'soundscapes')[this.mixer.currentSoundscape].soundboard[id];

            let src;
            if (settings.selectedPlaylist == 'FP') {
                src = settings.soundSrc;
                const ret = await FilePicker.browse("data", src, {wildcard:true});
                const files = ret.files;
                if (files.length == 1) 
                    src = files;
                else {
                    let value = Math.floor(Math.random() * Math.floor(files.length));
                    src = files[value];
                }
            }
            else {
                const playlist = game.playlists.get(settings.selectedPlaylist);
                if (playlist == undefined) return;
                const sound = playlist.sounds.get(settings.sound);
                if (sound == undefined) return;
                src = sound.path;
            }
            
            if (src == undefined || src == '' || src == null) return;
            
            await this.soundboardPlaying.push({audio:new Audio(src),source: undefined});
            const len = this.soundboardPlaying.length-1;
            //const audio = ;
            this.soundboardPlaying[len].source = game.audio.context.createMediaElementSource(this.soundboardPlaying[len].audio);
            
            this.soundboardPlaying[len].source.mediaElement.volume = settings.volume/100;
            let playbackSpeed = settings.playbackSpeed;
            if (settings.playbackRandom != undefined && settings.playbackRandom != 0) {
                playbackSpeed += (Math.random()-0.5)*settings.playbackRandom; 
            }
            this.soundboardPlaying[len].source.mediaElement.playbackRate = playbackSpeed;

            if (game.user.isGM) {
                const payload = {
                  "msgType": "playSoundboard",
                  "src": src,
                  "volume": settings.volume/100,
                  "playbackSpeed": playbackSpeed
                };
                game.socket.emit(`module.Soundscape`, payload);
            }
            
            this.soundboardPlaying[len].source.connect(this.mixer.master.effects.soundboardGain.node).connect(this.mixer.master.effects.interfaceGain.node).connect(game.audio.context.destination);
            this.soundboardPlaying[len].audio.play({volume:settings.volume/100});
        })

        soundboardEnable.on("click", async (event)=>{
            let soundboardEnabled = !game.settings.get(moduleName,'sbEnabled')
            await game.settings.set(moduleName,'sbEnabled',soundboardEnabled)
            if (soundboardEnabled) {
                $('#SoundScape_mainColumn')[0].style.width='49%'
                $('#SoundScape_mainRow')[0].style.width='836px'
                $('#SoundScape_soundboardColumn')[0].style.display=''
                $('#SoundScape_columnSpacer')[0].style.display=''
                $('#soundscape_mixer')[0].style.width='auto'
            }
            else {
                $('#SoundScape_mainColumn')[0].style.width='100%'
                $('#SoundScape_mainRow')[0].style.width='410px'
                $('#SoundScape_soundboardColumn')[0].style.display='none'
                $('#SoundScape_columnSpacer')[0].style.display='none' 
                $('#soundscape_mixer')[0].style.width='auto'
            }
            await this.render(true);
        })
        /*
        newSoundscape.on("click",async (event)=>{
            const SSsettings = this.mixer.newSoundscape();
            let settings = game.settings.get(moduleName,'soundscapes');
            settings.push(SSsettings);
            this.mixer.currentSoundscape = settings.length-1;
            await game.settings.set(moduleName,'soundscapes',settings);
            this.mixer.refresh();
        })
        */
        nextSoundscape.on("click", (event)=>{
            this.mixer.stop();
            const nrOfScapes = game.settings.get(moduleName,'soundscapes').length;
            this.mixer.currentSoundscape++;
            if (this.mixer.currentSoundscape >= nrOfScapes-1) this.mixer.currentSoundscape = nrOfScapes-1;
            this.mixer.refresh();
        })
        prevSoundscape.on("click", (event)=>{
            this.mixer.stop();
            this.mixer.currentSoundscape--;
            if (this.mixer.currentSoundscape < 0) this.mixer.currentSoundscape = 0;
            this.mixer.refresh();
        })
        soundscapeName.on("change",(event)=>{
            this.mixer.setSoundscapeName(event.currentTarget.value);
        });

        volumeSlider.on("input change",(event)=>{
            let soundNumber = event.currentTarget.id.replace('volumeSlider-','');
            const val = event.currentTarget.value;
            html.find("input[id=volumeNumber-"+soundNumber+"]")[0].value=val;
            if (soundNumber == 'master') this.mixer.master.setVolume(val);
            else if (this.mixer.channels[soundNumber].getLink()) this.mixer.setLinkVolumes(val,soundNumber)
            else this.mixer.channels[soundNumber].setVolume(val);
            
            let settings = game.settings.get(moduleName,'soundscapes');
            if (soundNumber == 'master') settings[this.mixer.currentSoundscape].master.volume = val;
            else settings[this.mixer.currentSoundscape].channels[soundNumber].volume = val;
            game.settings.set(moduleName,'soundscapes',settings);

            soundNumber++;
            sendWS("CH " + soundNumber + " VOLUME " + val);
        })
        volumeNumber.on("change",(event)=>{
            let soundNumber = event.currentTarget.id.replace('volumeNumber-','');
            const val = event.currentTarget.value;
            html.find("input[id=volumeSlider-"+soundNumber+"]")[0].value=val;
            if (soundNumber == 'master') this.mixer.master.setVolume(val);
            else if (this.mixer.channels[soundNumber].getLink()) this.mixer.setLinkVolumes(val,soundNumber)
            else this.mixer.channels[soundNumber].setVolume(val);

            let settings = game.settings.get(moduleName,'soundscapes');
            if (soundNumber == 'master') settings[this.mixer.currentSoundscape].master.volume = val;
            else settings[this.mixer.currentSoundscape].channels[soundNumber].volume = val;
            game.settings.set(moduleName,'soundscapes',settings);

            soundNumber++;
            sendWS("CH " + soundNumber + " VOLUME " + val);
        })
        mute.on("click",(event)=>{
            const soundNumber = event.currentTarget.id.replace('mute-','');
            let background;
            let mute;
            if (soundNumber == 'master') {
                mute = this.mixer.master.getMute();
                background = mute ? "rgb(138, 0, 0)" : "rgb(255, 0, 0)";
                this.mixer.master.setMute(!mute);
            }
            else {
                mute = this.mixer.channels[soundNumber].getMute();
                background = mute ? "rgb(138, 0, 0)" : "rgb(255, 0, 0)";
                this.mixer.channels[soundNumber].setMute(!mute);
            }
            html.find("button[id=mute-"+soundNumber+"]")[0].style.backgroundColor = background;

            let settings = game.settings.get(moduleName,'soundscapes');
            if (soundNumber == 'master') settings[this.mixer.currentSoundscape].master.mute = !mute;
            else settings[this.mixer.currentSoundscape].channels[soundNumber].mute = !mute;
            game.settings.set(moduleName,'soundscapes',settings);
        })
        solo.on("click",(event)=>{
            const soundNumber = event.currentTarget.id.replace('solo-','');
            if (soundNumber == 'master') return;
            const solo = this.mixer.channels[soundNumber].getSolo();
            const background = solo ? "rgb(129,129,0)" : "rgb(255, 255, 0)";
            this.mixer.channels[soundNumber].setSolo(!solo);
            html.find("button[id=solo-"+soundNumber+"]")[0].style.backgroundColor = background;
            this.mixer.configureSolo();

            let settings = game.settings.get(moduleName,'soundscapes');
            settings[this.mixer.currentSoundscape].channels[soundNumber].solo = !solo;
            game.settings.set(moduleName,'soundscapes',settings);
        })
        link.on("click",(event)=>{
            const soundNumber = event.currentTarget.id.replace('link-','');
            let link = this.mixer.channels[soundNumber].getLink();
            const background = link ? "rgb(0,15,255)" : "rgb(0,150,255)";
            html.find("button[id=link-"+soundNumber+"]")[0].style.backgroundColor = background;
            this.mixer.channels[soundNumber].setLink(!link);
            this.mixer.configureLink();

            let settings = game.settings.get(moduleName,'soundscapes');
            settings[this.mixer.currentSoundscape].channels[soundNumber].link = !link;
            game.settings.set(moduleName,'soundscapes',settings);
        })

        panner.on("input change",(event)=>{
            const soundNumber = event.currentTarget.id.replace('panSlider-','');
            const val = event.currentTarget.value/25;
            this.mixer.channels[soundNumber].setPan(val);

            let settings = game.settings.get(moduleName,'soundscapes');
            settings[this.mixer.currentSoundscape].channels[soundNumber].pan = val;
            game.settings.set(moduleName,'soundscapes',settings);
        })

        play.on("click",(event)=>{
            if (this.mixer.playing == false) {
                this.mixer.start();
                html.find("button[name=play]")[0].innerHTML = `<i class="fas fa-stop"></i>`;
                for (let i=0; i<8; i++) {
                    const channel = this.mixer.channels[i];
                    if (channel.soundNode != undefined && channel.soundNode.loaded)
                        html.find(`button[id=playSound-${i}]`)[0].innerHTML = `<i class="fas fa-stop"></i>`;
                }
            }
            else {
                this.mixer.stop();
                html.find("button[name=play]")[0].innerHTML = `<i class="fas fa-play"></i>`;
                for (let i=0; i<8; i++) {
                    html.find(`button[id=playSound-${i}]`)[0].innerHTML = `<i class="fas fa-play"></i>`;
                }
            }
        })

        playSound.on("click",async (event)=>{
            const soundNumber = event.currentTarget.id.replace('playSound-','');
            const channel = this.mixer.channels[soundNumber];
            if (channel.soundNode == undefined || channel.soundNode.loaded == false) return;
            const playing = channel.soundNode.playing;
            if (playing == false) {
                this.mixer.start(soundNumber);
                html.find(`button[id=playSound-${soundNumber}]`)[0].innerHTML = `<i class="fas fa-stop"></i>`;
                html.find("button[name=play]")[0].innerHTML = `<i class="fas fa-stop"></i>`;
            }
            else {
                await this.mixer.stop(soundNumber);
                html.find(`button[id=playSound-${soundNumber}]`)[0].innerHTML = `<i class="fas fa-play"></i>`;
                if (this.mixer.playing == false) html.find("button[name=play]")[0].innerHTML = `<i class="fas fa-play"></i>`;
            }
        })

        config.on("click",(event)=>{
            const soundNumber = event.currentTarget.id.replace('config-','');
            let soundConfig = new SoundConfig();
            soundConfig.setData(this.mixer.channels[soundNumber],this, this.mixer.currentSoundscape);
            soundConfig.render(true);
        })

        fx.on("click",(event)=>{
            const soundNumber = event.currentTarget.id.replace('fx-','');
            this.fxConfig = new FXConfig();
            this.fxConfig.setData(soundNumber,this,this.mixer);
            this.fxConfig.render(true);
            
        })

        sbButtonLabel.on("click", async (event)=>{
            const soundNumber = event.currentTarget.id.replace('sbButtonLabel-','');
            let dialog = await new soundboardConfig();
            await dialog.setMixer(this.mixer,soundNumber,this);
            dialog.render(true);
        })
        
        mixerConfigBtn.on("click", async(event)=>{
            let dialog = await new mixerConfig();
            await dialog.setMixer(this.mixer,this);
            dialog.render(true);
        });
    }
  }

  export class soundboardConfig extends FormApplication {
    constructor(data, options) {
        super(data, options);
        this.mixer;
        this.soundNr;
        this.currentSoundscape;
        this.parent;
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
            template: "./modules/Soundscape/templates/soundboardConfig.html",
            width: "500px"
        });
    }
  
    /**
     * Provide data to the template
     */
    async getData() {
        let settings = game.settings.get(moduleName,'soundscapes')[this.currentSoundscape].soundboard[this.soundNr];
        if (settings == undefined)
            settings = {
                name: '',
                selectedPlaylist: '',
                sound: '',
                soundSrc: '',
                imageSrc: '',
                volume: 50,
                playbackSpeed: 1,
                playbackRandom: 0
            }
        

        let styleSS = "flex";
        let styleFP ="none";
        if (settings.selectedPlaylist == 'FP') {
            styleSS = 'none';
            styleFP = 'flex'
        }

        //Create the playlist array
        let playlists = [];
        playlists.push({id:"none",name:game.i18n.localize("Soundscape.None")});
        playlists.push({id:"FP",name:game.i18n.localize("Soundscape.FilePicker")})

        const playlistArray = game.playlists.contents;
        for (let playlist of playlistArray) 
            playlists.push({id: playlist.id, name: playlist.name})

        let sounds = [];
        if (settings.selectedPlaylist != 'none' && settings.selectedPlaylist != 'FP') {
            let pl = playlistArray.find(p => p.id == settings.selectedPlaylist)

            if (pl == undefined){
                settings.selectedPlaylist = 'none';
                sounds = [];
            }
            else {
                //Add the sound name and id to the sounds array
                for (let sound of pl.sounds.contents)
                    sounds.push({
                        name: sound.name,
                        id: sound.id
                    });
                
                //Get the playlist id
                settings.selectedPlaylist = pl.id;
            }  
        }
        
        return {
            soundNr: this.soundNr+1,
            playlists,
            sounds,
            settings,
            styleSS,
            styleFP

        } 
    }
  
    /**
     * Update on form submit
     * @param {*} event 
     * @param {*} formData 
     */
    async _updateObject(event, formData) {
        const setting = {
            name: formData.namebox,
            selectedPlaylist: formData.playlist,
            sound: formData.sounds,
            soundSrc: formData.src,
            imageSrc: formData.img,
            volume: formData.volume,
            playbackSpeed: formData.speed,
            playbackRandom: formData.randSpeed
        }
        let settings = game.settings.get(moduleName,'soundscapes');
        settings[this.currentSoundscape].soundboard[this.soundNr] = setting;
        await game.settings.set(moduleName,'soundscapes',settings)
        this.parent.render(true);
    }
  
    activateListeners(html) {
        super.activateListeners(html);

        const playlistSelect = html.find("select[name='playlist']");
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
        
        playlistSelect.on("change", event => {
            //Get the selected playlist and the sounds of that playlist
            let selectedPlaylist;
            //let sounds = [];
            if (event.target.value==undefined) selectedPlaylist = 'none';
            else if (event.target.value == 'none') selectedPlaylist = 'none';
            else if (event.target.value == 'FP') {
                selectedPlaylist = 'FP';

                //Show the file picker
                document.querySelector(`#fp`).style='display:flex';
                
                //Hide the sound selector
                document.querySelector(`#ss`).style='display:none';
            }
            else {
                //Hide the file picker
                document.querySelector(`#fp`).style='display:none';
                
                //Show the sound selector
                document.querySelector(`#ss`).style='display:flex';

                const playlistArray = game.playlists.contents;
                const pl = playlistArray.find(p => p.id == event.target.value)
                selectedPlaylist = pl.id;

                //Get the sound select element
                let SSpicker = document.getElementById(`soundSelect`);

                //Empty ss element
                SSpicker.options.length=0;

                //Create new options and append them
                let optionNone = document.createElement('option');
                optionNone.value = "";
                optionNone.innerHTML = game.i18n.localize("Soundscape.None");
                SSpicker.appendChild(optionNone);

                
                for (let sound of pl.sounds.contents) {
                    let newOption = document.createElement('option');
                    newOption.value = sound.id;
                    newOption.innerHTML = sound.name;
                    SSpicker.appendChild(newOption);
                } 
                       
            }

            //Save the new playlist to this.settings, and update the settings
            //this.settings.selectedPlaylists[iteration-1]=event.target.value;
            //this.updateSettings(this.settings);
        });
    }
}

class mixerConfig extends FormApplication {
    constructor(data, options) {
        super(data, options);
        this.mixer;
        this.parent;
        this.soundscapes;
    }

    setMixer(mixer,parent) {
        this.mixer = mixer;
        
        this.parent = parent;
    }
  
    /**
     * Default Options for this FormApplication
     */
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            id: "soundscape_mixerConfig",
            title: "Soundscape: " + game.i18n.localize("Soundscape.MixerConfig"),
            template: "./modules/Soundscape/templates/mixerConfig.html",
            width: "500px",
            height: "auto",
            maxHeight: "600px"
        });
    }
  
    /**
     * Provide data to the template
     */
    async getData() {
        let allSoundscapes = game.settings.get(moduleName,'soundscapes')
        this.soundscapes = [];
        
        let iteration = 0;
        for (let i=0; i<allSoundscapes.length; i++)
            if (allSoundscapes[i] != null) {
                allSoundscapes[i].iteration = iteration;
                iteration++;
                allSoundscapes[i].number = iteration;
                this.soundscapes.push(allSoundscapes[i])
            }
        
        return {
            soundscapes: this.soundscapes

        } 
    }
  
    /**
     * Update on form submit
     * @param {*} event 
     * @param {*} formData 
     */
    async _updateObject(event, formData) {
        
    }
  
    activateListeners(html) {
        super.activateListeners(html);

        const name = html.find('input[name=name]');
        const load = html.find('button[name=load]')
        const moveUp = html.find('button[name=moveUp]');
        const moveDown = html.find('button[name=moveDown]');
        const copySoundboard = html.find('button[name=sbToSel]');
        const newSoundscape = html.find('button[name=new]');
        const selectAll = html.find('button[name=selectAll]');
        const deselectAll = html.find('button[name=deselectAll]');
        const deleteSelected = html.find('button[name=deleteSelected]');
        const copySelected = html.find('button[name=copySelected]');
        const exportSelected = html.find('button[name=exportSelected]');
        const importSelected = html.find('button[name=importSelected]');

        name.on('change', event => {
            const id = parseInt(event.currentTarget.id.replace('name-',''));
            let soundscapes = game.settings.get(moduleName,'soundscapes')
            soundscapes[id].name = event.currentTarget.value;
            game.settings.set(moduleName,'soundscapes',soundscapes);
        })
        load.on('click', event => {
            const id = parseInt(event.currentTarget.id.replace('load-',''));
            this.mixer.currentSoundscape = id;
            this.mixer.refresh();
            this.close();
        })

        moveUp.on('click', async event => {
            const id = parseInt(event.currentTarget.id.replace('moveUp-',''));
            if (id == 0) return;
            let soundscapes = game.settings.get(moduleName,'soundscapes')
            const tempElement = soundscapes[id];
            soundscapes[id] = soundscapes[id-1];
            soundscapes[id-1] = tempElement;
            await game.settings.set(moduleName, 'soundscapes', soundscapes);
            this.render(true);
        })

        moveDown.on('click', async event => {
            const id = parseInt(event.currentTarget.id.replace('moveDown-',''));
            let soundscapes = game.settings.get(moduleName,'soundscapes')
            if (id >= soundscapes.length - 1) return;
            const tempElement = soundscapes[id];
            soundscapes[id] = soundscapes[id+1];
            soundscapes[id+1] = tempElement;
            await game.settings.set(moduleName, 'soundscapes', soundscapes);
            this.render(true);
        })

        copySoundboard.on('click', event => {
            const id = parseInt(event.currentTarget.id.replace('sbToSel-',''));
            let soundscapes = game.settings.get(moduleName,'soundscapes')
            const soundboard = soundscapes[id].soundboard;
            const soundboardGain = soundscapes[id].soundboardGain;
            for (let i=0; i<soundscapes.length; i++) 
                if (html.find(`input[id=select-${i}]`)[0].checked) {
                    soundscapes[i].soundboard = soundboard;
                    soundscapes[i].soundboardGain = soundboardGain;
                }
            game.settings.set(moduleName,'soundscapes',soundscapes);
            ui.notifications.info(`Soundscape: Soundboard copied to selected soundscapes`);
        })

        newSoundscape.on('click', async event => {
            const newSoundscape = this.mixer.newSoundscape();
            let soundscapes = game.settings.get(moduleName,'soundscapes');
            soundscapes.push(newSoundscape);
            await game.settings.set(moduleName,'soundscapes',soundscapes);
            this.render(true);
        })

        selectAll.on('click', event => {
            for (let i=0; i<this.soundscapes.length; i++) 
                html.find(`input[id=select-${i}]`)[0].checked = true;
        })

        deselectAll.on('click', event => {
            for (let i=0; i<this.soundscapes.length; i++) 
                html.find(`input[id=select-${i}]`)[0].checked = false;
        })

        deleteSelected.on('click', async event => {
            let soundscapes = game.settings.get(moduleName,'soundscapes');
            for (let i=this.soundscapes.length-1; i>=0; i--) 
                if (html.find(`input[id=select-${i}]`)[0].checked)
                    soundscapes.splice(i,1);
            await game.settings.set(moduleName,'soundscapes',soundscapes);
            this.render(true);
        })

        copySelected.on('click', async event => {
            let soundscapes = game.settings.get(moduleName,'soundscapes');
            const ssLength = soundscapes.length;
            for (let i=0; i<ssLength; i++) 
                if (html.find(`input[id=select-${i}]`)[0].checked)
                    soundscapes.push(soundscapes[i]);
            await game.settings.set(moduleName,'soundscapes',soundscapes);
            this.render(true);
        })

        exportSelected.on('click', event => {
            let soundscapes = game.settings.get(moduleName,'soundscapes');
            let exports = [];
            for (let i=0; i<soundscapes.length; i++) 
                if (html.find(`input[id=select-${i}]`)[0].checked)
                    exports.push(soundscapes[i]);
            if (exports.length == 0) return;
            let exportDialog = new exportConfigForm();
            exportDialog.setData(exports);
            exportDialog.render(true);
        })

        importSelected.on('click', event => {
            let importDialog = new importConfigForm();
            importDialog.setData(this)
            importDialog.render(true);
        })
    }
}

class exportConfigForm extends FormApplication {
    constructor(data, options) {
        super(data, options);
        this.data = {};
    }

    /**
     * Default Options for this FormApplication
     */
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            id: "Soundscape_Export",
            title: "Soundscape: " + game.i18n.localize("Soundscape.Export"),
            template: "./modules/Soundscape/templates/exportDialog.html",
            width: 500,
            height: "auto"
        });
    }

    setData(data) {
        this.data = data;
    }

    /**
     * Provide data to the template
     */
    getData() {
        return {
            data: this.data,
            number: this.data.length
        } 
    }

    /**
     * Update on form submit
     * @param {*} event 
     * @param {*} formData 
     */
    async _updateObject(event, formData) {
        this.download(this.data,formData.name)
    }

    activateListeners(html) {
        super.activateListeners(html);
    }

    download(data,name) {
        let dataStr = JSON.stringify(data);
        let dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        let exportFileDefaultName = `${name}.json`;
        let linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    }
}

class importConfigForm extends FormApplication {
    constructor(data, options) {
        super(data, options);
        this.data = {};
        this.name = "";
        this.source = "";
        this.parent;
    }

    /**
     * Default Options for this FormApplication
     */
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            id: "Soundscape_Import",
            title: "Soundscape: " + game.i18n.localize("Soundscape.Import"),
            template: "./modules/Soundscape/templates/importDialog.html",
            width: 500,
            height: "auto"
        });
    }

    setData(parent) {
        this.parent = parent;
    }

    /**
     * Provide data to the template
     */
    getData() {
        return {

        } 
    }

    /**
     * Update on form submit
     * @param {*} event 
     * @param {*} formData 
     */
    async _updateObject(event, formData) {
        let soundscapes = game.settings.get(moduleName,'soundscapes');
        const newSoundscapes = soundscapes.concat(this.data);
        await game.settings.set(moduleName,'soundscapes',newSoundscapes)
        this.parent.render(true);
    }

    activateListeners(html) {
        super.activateListeners(html);

        const upload = html.find("input[id='uploadJson']");

        upload.on('change',(event) => {
            event.preventDefault();
            this.readJsonFile(event.target.files[0]); 
        })
    }

    readJsonFile(jsonFile) {
        var reader = new FileReader(); 
        reader.addEventListener('load', (loadEvent) => { 
          try { 
            let json = JSON.parse(loadEvent.target.result); 
            this.data = json;
          } catch (error) { 
            console.error(error); 
          } 
        }); 
        reader.readAsText(jsonFile); 
    } 


}


  