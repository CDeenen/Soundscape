import {moduleName} from "../../../soundscape.js";
import {Delay} from "./delay.js"
import {FFT} from "./fft.js"
import {helpMenuFx} from "../../Help/helpMenus.js";

export class channelFX {
    constructor(data, options) {
        this.delay = new Delay();
    }
}

export class FXConfig extends FormApplication {
    constructor(data, options) {
        super(data, options);
        this.mixer;
        this.parent;
        this.channelNr;
        this.channel;
        this.lowpass = false;
        this.bandpass1 = false;
        this.bandpass2 = false;
        this.highpass = false;

        this.playbackRate = 1;
        this.preservePitch = false;
        this.delayTime = 0;
        this.delayVolume = 100;

        this.fftInterval;
  
 
    }
  
    /**
     * Default Options for this FormApplication
     */
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            id: "soundscape_fxConfig",
            title: "FX Configuration",
            template: "./modules/soundscape/src/Channels/Effects/fxConfig.html",
            width: "1000px"
        });
    }

    setData(channel,mixer) {
        this.channelNr = channel.channelNr;
        this.mixer = mixer;
        this.channel = channel;
        parent = this;
        setTimeout(function(){
            channel.effects.eq.getFrequencyResponse();
            channel.effects.fft = new FFT(channel,channel.context);
            parent.fftInterval = setInterval(function(){   
                
                if ($('#soundscape_fxConfig')[0] == undefined) {
                    channel.effects.fft = undefined;
                    clearInterval(parent.fftInterval);
                    parent.fftInterval = undefined;
                }
                else
                    channel.effects.fft.draw();
             },16)
        },100);
    }
  
    /**
     * Provide data to the template
     */
    getData() {
        const eq = this.channel.effects.eq;
        const delay = this.channel.effects.delay;
        const playbackRate = this.channel.settings.playbackRate.rate;
        const preservePitch = this.channel.settings.playbackRate.preservePitch ? true : false;
        
        let eq1 = [
            {
                id:"highPass",
                name: "High Pass Filter",
                enable: eq.settings.highPass.enable,
                checked: eq.settings.highPass.enable ? "checked" : "",
                value: Math.round(eq.settings.highPass.frequency),
                sliderValue: Math.log10(eq.settings.highPass.frequency/20)*30,
                qSlider: Math.log10(eq.settings.highPass.q/0.1)*50,
                q: Math.round(eq.settings.highPass.q*100)/100,
                gain: 0,
                showGain: "display:none"
            },
            {
                id:"peaking1",
                name: "Peak Filter 1",
                enable: eq.settings.peaking1.enable,
                checked: eq.settings.peaking1.enable ? "checked" : "",
                value: Math.round(eq.settings.peaking1.frequency),
                sliderValue: Math.log10(eq.settings.peaking1.frequency/20)*30,
                qSlider: Math.log10(eq.settings.peaking1.q/0.1)*50,
                q: Math.round(eq.settings.peaking1.q*100)/100,
                gain: eq.settings.peaking1.gain,
                showGain: ""
            }
        ]
        let eq2 = [
            {
                id:"lowPass",
                name: "Low Pass Filter",
                enable: eq.settings.lowPass.enable,
                checked: eq.settings.lowPass.enable ? "checked" : "",
                value: Math.round(eq.settings.lowPass.frequency),
                sliderValue: Math.log10(eq.settings.lowPass.frequency/20)*30,
                qSlider: Math.log10(eq.settings.lowPass.q/0.1)*50,
                q: Math.round(eq.settings.lowPass.q*100)/100,
                gain: 0,
                showGain: "display:none"
            },
            {
                id:"peaking2",
                name: "Peak Filter 2",
                enable: eq.settings.peaking2.enable,
                checked: eq.settings.peaking2.enable ? "checked" : "",
                value: Math.round(eq.settings.peaking2.frequency),
                sliderValue: Math.log10(eq.settings.peaking2.frequency/20)*30,
                qSlider: Math.log10(eq.settings.peaking2.q/0.1)*50,
                q: Math.round(eq.settings.peaking2.q*100)/100,
                gain: eq.settings.peaking2.gain,
                showGain: ""
            } 
        ]
        
        return {
            channel: parseInt(this.channelNr)+1,
            name: this.channel.name,
            eq1: eq1,
            eq2: eq2,
            playbackRate: playbackRate*1000,
            playbackRateNr: playbackRate,
            preservePitch: preservePitch ? "checked" : "",
            delay: delay.delay*1000,
            delayNr: delay.delay,
            delayChecked: delay.enable ? "checked" : "",
            delayVolume: delay.delayVolume*100
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

        setTimeout(function() {
            document.getElementById('soundscape_fxHelp').addEventListener("click", (event) => {
                let dialog = new helpMenuFx();
                dialog.render(true);
            })
        },100)

        const enable = html.find("input[name=Enable]");
        const Freq = html.find("input[name=Freq]");
        const FreqNr = html.find("input[name=FreqNr]");
        const Q = html.find("input[name=Q]");
        const QNr = html.find("input[name=QNr]");
        const gain = html.find("input[name=Gain]");
        const gainNr = html.find("input[name=GainNr]");

        enable.on('change',(event)=>{
            const filterId = event.target.id.replace('Enable-','');
            const enable = event.target.checked;
            this.channel.effects.eq.setEnable(filterId,enable);

            let settings = game.settings.get(moduleName,'soundscapes');
            settings[this.mixer.currentSoundscape].channels[this.channelNr].settings.effects.equalizer[filterId].enable = enable;
            game.settings.set(moduleName,'soundscapes',settings);
        })

        Freq.on('input change',(event)=>{
            let value = event.target.value;
            value = 20*Math.pow(10,value/30)
            const filterId = event.target.id.replace('Freq-','');
            html.find("input[id=FreqNr-"+filterId+"]")[0].value=Math.round(value);
            this.channel.effects.eq.setFrequency(filterId,value);

            let settings = game.settings.get(moduleName,'soundscapes');
            settings[this.mixer.currentSoundscape].channels[this.channelNr].settings.effects.equalizer[filterId].frequency = value;
            game.settings.set(moduleName,'soundscapes',settings);
        })
        FreqNr.on('change',(event)=>{
            const value = event.target.value;
            const filterId = event.target.id.replace('FreqNr-','');
            html.find("input[id=Freq-"+filterId+"]")[0].value=Math.log10(value/20)*30;
            this.channel.effects.eq.setFrequency(filterId,value);

            let settings = game.settings.get(moduleName,'soundscapes');
            settings[this.mixer.currentSoundscape].channels[this.channelNr].settings.effects.equalizer[filterId].frequency = value;
            game.settings.set(moduleName,'soundscapes',settings);
        })
        Q.on('input change',(event)=>{
            let qualityFactor = event.target.value;
            qualityFactor = 0.1*Math.pow(10,qualityFactor/50)
            const filterId = event.target.id.replace('Q-','');
            html.find("input[id=QNr-"+filterId+"]")[0].value=Math.round(100*qualityFactor)/100;
            this.channel.effects.eq.setQ(filterId,qualityFactor);

            let settings = game.settings.get(moduleName,'soundscapes');
            settings[this.mixer.currentSoundscape].channels[this.channelNr].settings.effects.equalizer[filterId].q = qualityFactor;
            game.settings.set(moduleName,'soundscapes',settings);
        })
        QNr.on('change',(event)=>{
            const qualityFactor = event.target.value;
            const filterId = event.target.id.replace('QNr-','');
            html.find("input[id=Q-"+filterId+"]")[0].value=Math.log10(qualityFactor/0.1)*50;
            this.channel.effects.eq.setQ(filterId,qualityFactor);

            let settings = game.settings.get(moduleName,'soundscapes');
            settings[this.mixer.currentSoundscape].channels[this.channelNr].settings.effects.equalizer[filterId].q = qualityFactor;
            game.settings.set(moduleName,'soundscapes',settings);
        })
        gain.on('input change',(event)=>{
            const gain = event.target.value;
            const filterId = event.target.id.replace('Gain-','');
            html.find("input[id=GainNr-"+filterId+"]")[0].value=gain;
            this.channel.effects.eq.setGain(filterId,gain);

            let settings = game.settings.get(moduleName,'soundscapes');
            settings[this.mixer.currentSoundscape].channels[this.channelNr].settings.effects.equalizer[filterId].gain = gain;
            game.settings.set(moduleName,'soundscapes',settings);
        })
        gainNr.on('change',(event)=>{
            const gain = event.target.value;
            const filterId = event.target.id.replace('GainNr-','');
            html.find("input[id=Gain-"+filterId+"]")[0].value=gain;
            this.channel.effects.eq.setGain(filterId,gain);

            let settings = game.settings.get(moduleName,'soundscapes');
            settings[this.mixer.currentSoundscape].channels[this.channelNr].settings.effects.equalizer[filterId].gain = gain;
            game.settings.set(moduleName,'soundscapes',settings);
        })
      

        const playbackRate = html.find("input[name=playbackRate]");
        const playbackRateNr = html.find("input[name=playbackRateNr]");
        const preservePitch = html.find("input[name=preservePitch]");
        playbackRate.on('input change',(event)=>{
            let val = event.target.value/1000;
            html.find("input[id=playbackRateNr]")[0].value=val;
            let settings = game.settings.get(moduleName,'soundscapes');
            settings[this.mixer.currentSoundscape].channels[this.channelNr].settings.playbackRate.rate = val;
            game.settings.set(moduleName,'soundscapes',settings);
            this.channel.setPlaybackRate(settings[this.mixer.currentSoundscape].channels[this.channelNr].settings.playbackRate);
        })
        playbackRateNr.on('change',(event)=>{
            const val = event.target.value;
            html.find("input[id=playbackRate]")[0].value=val*1000;
            let settings = game.settings.get(moduleName,'soundscapes');
            settings[this.mixer.currentSoundscape].channels[this.channelNr].settings.playbackRate.rate = val;
            game.settings.set(moduleName,'soundscapes',settings);
            this.channel.setPlaybackRate(settings[this.mixer.currentSoundscape].channels[this.channelNr].settings.playbackRate);
        })
        preservePitch.on('change',(event)=>{
            const val = event.target.checked;
            let settings = game.settings.get(moduleName,'soundscapes');
            settings[this.mixer.currentSoundscape].channels[this.channelNr].settings.playbackRate.preservePitch = val;
            game.settings.set(moduleName,'soundscapes',settings);
            this.channel.setPlaybackRate(settings[this.mixer.currentSoundscape].channels[this.channelNr].settings.playbackRate);
        })

        const delayEnable = html.find("input[name=delayEnable]");
        const delay = html.find("input[name=delay]");
        const delayNr = html.find("input[name=delayNr]");
        const delayVolume = html.find("input[name=delayVolume]");
        const delayVolumeNr = html.find("input[name=delayVolumeNr]");
        delayEnable.on('change',(event)=>{
            const enable = event.target.checked;
            this.channel.effects.delay.setEnable(enable);

            let settings = game.settings.get(moduleName,'soundscapes');
            settings[this.mixer.currentSoundscape].channels[this.channelNr].settings.effects.delay.enable = enable;
            game.settings.set(moduleName,'soundscapes',settings);
        })
        delay.on('input change',(event)=>{
            let val = event.target.value/1000;
            html.find("input[id=delayNr]")[0].value=val;
            this.channel.effects.delay.setDelay(val);
            
            let settings = game.settings.get(moduleName,'soundscapes');
            settings[this.mixer.currentSoundscape].channels[this.channelNr].settings.effects.delay.delayTime = val;
            game.settings.set(moduleName,'soundscapes',settings);
        })
        delayNr.on('change',(event)=>{
            const val = event.target.value;
            html.find("input[id=delay]")[0].value=val*1000;
            this.channel.effects.delay.setDelay(val);

            let settings = game.settings.get(moduleName,'soundscapes');
            settings[this.mixer.currentSoundscape].channels[this.channelNr].settings.effects.delay.delayTime = val;
            game.settings.set(moduleName,'soundscapes',settings);
        })
        delayVolume.on('input change',(event)=>{
            let val = event.target.value/100;
            html.find("input[id=delayVolumeNr]")[0].value=val*100;
            this.channel.effects.delay.setVolume(val);

            let settings = game.settings.get(moduleName,'soundscapes');
            settings[this.mixer.currentSoundscape].channels[this.channelNr].settings.effects.delay.volume = val;
            game.settings.set(moduleName,'soundscapes',settings);
        })
        delayVolumeNr.on('change',(event)=>{
            const val = event.target.value/100;
            html.find("input[id=delayVolume]")[0].value=val*100;
            this.channel.effects.delay.setVolume(val);

            let settings = game.settings.get(moduleName,'soundscapes');
            settings[this.mixer.currentSoundscape].channels[this.channelNr].settings.effects.delay.volume = val;
            game.settings.set(moduleName,'soundscapes',settings);
        })

        
    }
}