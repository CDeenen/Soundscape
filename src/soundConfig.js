import {moduleName} from "../soundscape.js";
import {MixerHelpers} from "./helpers/mixerHelpers.js";
//import {currentSoundscape} from "./mixer.js";

export class SoundConfig extends FormApplication {
    
    constructor(data, options) {
        super(data, options);
        this.channel;
        this.mixerApp;
        this.playlistId;
        this.soundId;
        this.volume = 0.5;
        this.mixerHelpers = new MixerHelpers();
        this.forceStop = false;
        this.repeat;
        this.channelNumber;
        this.currentSoundscape;
        this.fadeOutStarted = false;
    }
  
    /**
     * Default Options for this FormApplication
     */
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            id: "soundscape_soundConfig",
            title: "Soundscape: "+game.i18n.localize("Soundscape.SoundConfig"),
            template: "./modules/Soundscape/templates/soundConfig.html",
            width: "1000px"
        });
    }

    setData(channel,mixerApp,currentSoundscape) {
        this.channel = channel;
        this.mixerApp = mixerApp;
        this.repeat = channel.settings.repeat;
        this.channelNumber = channel.settings.channel;
        this.currentSoundscape = currentSoundscape;
    }
  
    /**
     * Provide data to the template
     */
    getData() {
        let soundData = this.channel.settings.soundData;
        let playlists = [{name:'none',id:'none'},{name:game.i18n.localize("Soundscape.FilePicker"),id:'FP'}];
        let sounds = [{name:'none',id:game.i18n.localize("Soundscape.None")}];
        this.playlistId = soundData.playlistId;
        this.soundId = soundData.soundId;
        for (let p of game.playlists) {
            playlists.push({name:p.name,id:p.id});
            if (p.id == soundData.playlistId)
                for (let s of p.sounds.contents) {
                    sounds.push({name:s.name,id:s.id});
                }
        }

        if (soundData.playlistId != undefined && soundData.playlistId != "none" && soundData.soundId != undefined && soundData.soundId != "none") {
            const pl = game.playlists.get(soundData.playlistId);
            if (pl != undefined) {
                const sound = pl.sounds.contents.find(s => s.id == soundData.soundId)
                if (sound != undefined) {
                    const src = sound.data.path;
                    const parent = this;
                    setTimeout(function(){parent.preloadSound(src)},500);
                }
            }
        }
        else if (soundData.playlistId == 'FP') {
            const src = soundData.source;
            const parent = this;
            setTimeout(function(){parent.preloadSound(src)},500);
        }

        //Determine whether the sound selector or file picker should be displayed
        let styleSS = "";
        let styleFP ="none";
        if (soundData.playlistId == 'FP') {
            styleSS = 'none';
            styleFP = ''
        }

        return {
            channelNumber: this.channel.settings.channel + 1,
            name: this.channel.settings.name,
            playlists:playlists,
            sounds:sounds,
            selectedSound: soundData.soundId,
            selectedPlaylist: soundData.playlistId,
            start:this.mixerHelpers.getTimeStamp(soundData.startTime),
            stop:this.mixerHelpers.getTimeStamp(soundData.stopTime),
            repeat: this.channel.settings.repeat ? 'checked' : '',
            fadeIn: this.mixerHelpers.getTimeStamp(soundData.fade.fadeIn),
            fadeOut: this.mixerHelpers.getTimeStamp(soundData.fade.fadeOut),
            crossfade: soundData.fade.crossfade ? 'checked' : '',
            styleSS,
            styleFP,
            srcPath: soundData.source
        } 
    }
  
    /**
     * Update on form submit
     * @param {*} event 
     * @param {*} formData 
     */
    async _updateObject(event, formData) {
        if (this.previewSound?.playing) {
            this.previewSound.soundNode.stop();
            clearInterval(this.previewTimer);
            this.previewTimer = undefined;
        }
        
        let settings = game.settings.get(moduleName,'soundscapes');
        let channel = settings[this.currentSoundscape].channels[this.channelNumber];

        
        let src = "";
        if (formData.playlistId != 'none' && formData.playlistId != 'FP') {
            const pl = game.playlists.get(formData.playlistId)
            if (pl != undefined) {
                const sound = pl.sounds.contents.find(s => s.id == formData.soundId)
                if (sound != undefined)
                    src = sound.data.path;
            }
        }
        else src = formData.src;

        channel.repeat = formData.repeat;
        channel.name = formData.name;
        channel.soundData = {
            source: src,
            playlistId: formData.playlistId,
            soundId: formData.soundId,
            startTime: this.mixerHelpers.getSeconds(formData.start),
            stopTime: this.mixerHelpers.getSeconds(formData.stop),
            fade: {
                fadeIn: this.mixerHelpers.getSeconds(formData.fadeIn),
                fadeOut: this.mixerHelpers.getSeconds(formData.fadeOut),
                crossfade: formData.crossfade
            }
        }
        
        await game.settings.set(moduleName,'soundscapes',settings);
        await this.mixerApp.mixer.refresh();
        let parent = this;
        setTimeout(function(){
            for (let i=0; i<parent.mixerApp.mixer.channels.length; i++) {
                if (parent.mixerApp.mixer.channels[i].soundNode == undefined) continue;
                const loaded = parent.mixerApp.mixer.channels[i].loaded;
                document.getElementById(`playSound-${i}`).disabled = loaded ? '' : 'disabled';
            }
         }, 10);
        
    }
  
    activateListeners(html) {
        super.activateListeners(html);

        const playlist = html.find("select[name=playlistId]");
        const sound = html.find("select[name=soundId]");
        const preview = html.find("button[name=preview]")
        const volumeSlider = html.find("input[name=volumeSlider]");
        const repeat = html.find("input[name=repeat]")
        const filePicker = html.find("input[name=src]");

        repeat.on('change',(event)=>{
            this.repeat = event.target.checked;
        })
        playlist.on('change',(event)=>{
            document.getElementById(`duration`).value="";
            document.getElementById(`preview`).disabled = true;
            if (this.previewSound != undefined) {
                this.previewSound.soundNode.stop();
                this.previewSound = undefined;
            }

            //let sounds = [];
            if (event.target.value==undefined) this.playlistId = 'none';
            else if (event.target.value == 'none') this.playlistId = 'none';
            else if (event.target.value == 'FP') {
                this.playlistId = 'FP';

                //Show the file picker
                document.querySelector(`#fp`).style='';
                
                //Hide the sound selector
                document.querySelector(`#ss`).style='display:none';
            }
            else {
                //Hide the file picker
                document.querySelector(`#fp`).style='display:none';
                    
                //Show the sound selector
                document.querySelector(`#ss`).style='';

                this.playlistId = event.target.value;
                let soundSelect = document.getElementById(`sounds`);
                soundSelect.options.length=0;
                let optionNone = document.createElement('option');
                optionNone.value = "";
                optionNone.innerHTML = game.i18n.localize("Soundscape.None");
                soundSelect.appendChild(optionNone);

                if (this.playlistId != "none") {
                    const pl = game.playlists.get(this.playlistId)
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
            this.preloadSound(src);
        })

        sound.on('change',(event)=>{
            document.getElementById(`duration`).value="";
            document.getElementById(`preview`).disabled = true;
            if (this.previewSound != undefined) {
                this.previewSound.soundNode.stop();
                this.previewSound = undefined;
            }
            const sound = game.playlists.get(this.playlistId).sounds.contents.find(s => s.id == event.target.value)
            const src = sound.data.path;
            
            this.preloadSound(src);
        })
        volumeSlider.on("input change",(event)=>{
            this.updatePreviewVolume(event.target.value/100);
        })
        preview.on('click',(event)=>{
            
            if (this.previewSound.soundNode.playing) {
                html.find("button[name=preview]")[0].innerHTML = `<i class="fas fa-play"></i>`;
                this.stopPreview(true);
                clearInterval(this.previewTimer);
                this.previewTimer = undefined;
            }
            else {
                html.find("button[name=preview]")[0].innerHTML = `<i class="fas fa-stop"></i>`

                this.playPreview();
                this.forceStop = false;
                let parent = this;
                this.previewTimer = setInterval(function(){
                    if (parent.rendered == false) {
                        parent.stopPreview(true);
                        clearInterval(parent.previewTimer);
                        parent.previewTimer = undefined;
                        return;
                    }
                    const current = (parent.previewSound.soundNode.context.currentTime - parent.previewSound.soundNode.startTime) % parent.previewSound.soundNode.duration
                    if (current >= parent.mixerHelpers.getSeconds(document.getElementById(`stop`).value)) 
                        parent.stopPreview()
                    document.getElementById(`current`).value=parent.mixerHelpers.getTimeStamp(current);

                    const stopTime = parent.mixerHelpers.getSeconds(document.getElementById(`stop`).value);
                    const fadeOut = parent.mixerHelpers.getSeconds(document.getElementById(`fadeOut`).value);
 
                    if (fadeOut != 0 && current >= stopTime - fadeOut) {
                        if (current >= stopTime)
                            parent.fadeOutStarted = false;
                        else if (parent.fadeOutStarted == false) {
                            parent.fadeOutStarted = true;
                            parent.previewSound.gainNode.gain.linearRampToValueAtTime(0,game.audio.context.currentTime+fadeOut);
                        }
                        
                    }
                    else
                        parent.fadeOutStarted = false;
                    
                },100)
            }
        })
    }

    updatePreviewVolume(volume){
        this.volume = volume;
        //this.previewSound.sound.volume = volume;
        this.previewSound.outputGainNode.gain.value = volume;
    }

    playPreview() {
        const startTime = this.mixerHelpers.getSeconds(document.getElementById(`start`).value);
        const  offset = (startTime == false || startTime == undefined) ? 0 : startTime;
        this.previewSound.soundNode.play({volume:1,offset:offset});
    }

    async preloadSound(src,html) {
        this.previewSound = {
            soundNode: new Sound(src),
            gainNode: game.audio.context.createGain(),
            outputGainNode: game.audio.context.createGain()
        }

        if(this.previewSound.soundNode.loaded == false) await this.previewSound.soundNode.load();

        
        this.previewSound.soundNode.on('stop',()=>{
            this.fadeOutStarted = false;
            if (this.forceStop == false && this.repeat) {
                let startTime = this.mixerHelpers.getSeconds(document.getElementById(`start`).value);
                const  offset = (startTime == false || startTime == undefined) ? 0 : startTime;
                this.previewSound.gainNode.gain.setValueAtTime(0, game.audio.context.currentTime);
                this.previewSound.soundNode.play({volume:1,offset:offset});
                
            }
            else {
                clearInterval(this.previewTimer);
                this.previewTimer = undefined;
                document.getElementById(`preview`).innerHTML = `<i class="fas fa-play"></i>`;
            }

        })
        this.previewSound.soundNode.on('start',()=>{
            this.fadeOutStarted = false;
            const startTime = this.mixerHelpers.getSeconds(document.getElementById(`start`).value);
            const offset = (startTime == false || startTime == undefined) ? 0 : startTime;
            const fadeIn = this.mixerHelpers.getSeconds(document.getElementById(`fadeIn`).value);

            this.previewSound.soundNode.node.disconnect();
            this.previewSound.soundNode.node.connect(this.previewSound.gainNode).connect(this.previewSound.outputGainNode).connect(this.previewSound.soundNode.context.destination);

            if (fadeIn != 0) {
                this.previewSound.gainNode.gain.setValueAtTime(0, game.audio.context.currentTime);
                this.previewSound.gainNode.gain.linearRampToValueAtTime(this.volume,game.audio.context.currentTime+fadeIn+offset);
            }
            else {
                this.previewSound.gainNode.gain.setValueAtTime(this.volume, game.audio.context.currentTime);
            }
            
        })

        document.getElementById(`duration`).value=this.mixerHelpers.getTimeStamp(this.previewSound.soundNode.duration);
        document.getElementById(`preview`).disabled = false;
        if (this.mixerHelpers.getSeconds(document.getElementById(`stop`).value) == 0)
            document.getElementById(`stop`).value=this.mixerHelpers.getTimeStamp(this.previewSound.soundNode.duration);

    }

    stopPreview(force = false) {
        if (force) {
            this.forceStop = true;
        }
        this.previewSound.soundNode.stop();
    }
  }