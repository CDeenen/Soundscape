export class EQ {
    constructor(channel) {
        this.channel = channel;
        this.highPass = game.audio.context.createBiquadFilter();
        this.lowPass = game.audio.context.createBiquadFilter();
        this.peaking1 = game.audio.context.createBiquadFilter();
        this.peaking2 = game.audio.context.createBiquadFilter();
        this.gain = game.audio.context.createGain();
        this.peaking1.type = "peaking";
        this.peaking2.type = "peaking";
        this.highPass.type = "highpass";
        this.settings = {
            highPass: {
                enable: false,
                frequency: 50,
                q: 1
            },
            peaking1: {
                enable: false,
                frequency: 500,
                q: 1,
                gain: 1
            },
            peaking2: {
                enable: false,
                frequency: 1000,
                q: 1,
                gain: 1
            },
            lowPass: {
                enable: false,
                frequency: 2000,
                q: 1
            }
        };
        this.anyEnable = false;

        this.freqArray = new Float32Array(595);
        this.freqArray[0] = 20;
        for (let i=1; i<this.freqArray.length; i++) {
            const value = this.freqArray[i-1]*Math.pow(10,1/(this.freqArray.length/3))
            this.freqArray[i] = value
        }
        
        let parent = this;
        setTimeout(function(){
            parent.initialize(parent.channel.settings.effects.equalizer);
         }, 100);
        
    }

    initialize(settings) {
        this.setAll('lowPass',settings.lowPass.enable,settings.lowPass.frequency,settings.lowPass.q)
        this.setAll('highPass',settings.highPass.enable,settings.highPass.frequency,settings.highPass.q)
        this.setAll('peaking1',settings.peaking1.enable,settings.peaking1.frequency,settings.peaking1.q,settings.peaking1.gain)
        this.setAll('peaking2',settings.peaking2.enable,settings.peaking2.frequency,settings.peaking2.q,settings.peaking2.gain)
    }

    async setFrequency(filterId,frequency) {
        if (game.user.isGM) {
            const payload = {
              "msgType": "eqSetFrequency",
              "channelNr": this.channel.settings.channel,
              filterId,
              frequency
            };
            game.socket.emit(`module.Soundscape`, payload);
        }
        this.settings[filterId].frequency = frequency;
        await this.getThisNode(filterId).frequency.setValueAtTime(frequency,game.audio.context.currentTime)
        let parent = this;
        setTimeout(function(){ parent.getFrequencyResponse(),100});
    }

    setQ(filterId,qualityFactor) {
        if (game.user.isGM) {
            const payload = {
              "msgType": "eqSetQ",
              "channelNr": this.channel.settings.channel,
              filterId,
              qualityFactor
            };
            game.socket.emit(`module.Soundscape`, payload);
        }
        
        this.settings[filterId].q = qualityFactor;
       
        this.getThisNode(filterId).Q.value=qualityFactor;
        let parent = this;
        setTimeout(function(){ parent.getFrequencyResponse(),100});
    }

    setGain(filterId,gain) {
        if (game.user.isGM) {
            const payload = {
              "msgType": "eqSetGain",
              "channelNr": this.channel.settings.channel,
              filterId,
              gain
            };
            game.socket.emit(`module.Soundscape`, payload);
        }
        this.settings[filterId].gain = gain;
        this.getThisNode(filterId).gain.setValueAtTime(gain,game.audio.context.currentTime);
        let parent = this;
        setTimeout(function(){ parent.getFrequencyResponse(),100});
    }

    async getFrequencyResponse() {
        let canvas = document.getElementById("freqResponse");
        if (this.anyEnable == false) return;
        if (canvas == undefined) return;
        let canvasCtx = canvas.getContext("2d");
        //await this.getThisNode('lowPass').frequency.setValueAtTime(2000,game.audio.context.currentTime)
       // var frequencyHz = new Float32Array(600);
        var lowPassMagResponse = new Float32Array(this.freqArray.length);
        var highPassMagResponse = new Float32Array(this.freqArray.length);
        var peaking1MagResponse = new Float32Array(this.freqArray.length);
        var peaking2MagResponse = new Float32Array(this.freqArray.length);
        var phaseResponse = new Float32Array(this.freqArray.length);

        if (this.settings.highPass.enable) this.highPass.getFrequencyResponse(this.freqArray,highPassMagResponse,phaseResponse);
        else for (let i=0; i<this.freqArray.length; i++) highPassMagResponse[i] = 1;
        if (this.settings.lowPass.enable) this.lowPass.getFrequencyResponse(this.freqArray,lowPassMagResponse,phaseResponse);
        else for (let i=0; i<this.freqArray.length; i++) lowPassMagResponse[i] = 1;
        if (this.settings.peaking1.enable) this.peaking1.getFrequencyResponse(this.freqArray,peaking1MagResponse,phaseResponse);
        else for (let i=0; i<this.freqArray.length; i++) peaking1MagResponse[i] = 1;
        if (this.settings.peaking2.enable) this.peaking2.getFrequencyResponse(this.freqArray,peaking2MagResponse,phaseResponse);
        else for (let i=0; i<this.freqArray.length; i++) peaking2MagResponse[i] = 1;
        
        //console.log(magResponse)

        let horOffset = 25;
        let vertOffset = 20;
        
        canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
        canvasCtx.lineWidth = 1;

        canvasCtx.globalAlpha = 0.75;
        canvasCtx.beginPath();
        canvasCtx.strokeStyle = "red";
        canvasCtx.lineWidth = 1;
        for (var i = 0; i < canvas.width; ++i) {
            var response = (lowPassMagResponse[i] * highPassMagResponse[i] * peaking1MagResponse[i] * peaking2MagResponse[i]);
            response = 20.0 * Math.log(response) / Math.LN10;
            //var y = (canvas.height) - (0.5*canvas.height) * response - vertOffset;
            let dbScale = 30;
            const height = canvas.height-vertOffset;
            let y = (0.5 * height) - (0.5 * height) / dbScale * response;
            if (y>height) y = height;
            var x = i*canvas.width/this.freqArray.length + horOffset;
            //var y = canvas.height/2 - response*canvas.height;
            //console.log(response,y,canvas.height)
            //var y = dbToY(dbResponse);
            if ( i == 0 ) {
                canvasCtx.moveTo(x, y);
            } 
            else {
                canvasCtx.lineTo(x, y);
            }
        }
        canvasCtx.stroke();
    }

    getFrequencyValue(frequency,dataArray) {
        var nyquist = this.node.context.sampleRate/2;
        var index = Math.round(frequency/nyquist * this.node.frequencyBinCount);
        return dataArray[index];
    }


    setEnable(filterId,enable) {
        if (game.user.isGM) {
            const payload = {
              "msgType": "eqSetEnable",
              "channelNr": this.channel.settings.channel,
              filterId,
              enable
            };
            game.socket.emit(`module.Soundscape`, payload);
        }
        
        if (enable) {
            this.anyEnable = true;
            this.getPreviousNode(filterId).disconnect();
            this.getPreviousNode(filterId).connect(this.getThisNode(filterId)).connect(this.getNextNode(filterId));
        }
        else if (this.getEnable(filterId)) {
            this.getPreviousNode(filterId).disconnect(this.getThisNode(filterId));
            this.getPreviousNode(filterId).connect(this.getNextNode(filterId));
        }
        this.settings[filterId].enable = enable;
        //if (filterId == 'lowPass') this.enable.lowPass = enable;
        //else if (filterId == 'peaking1') this.enable.peaking1 = enable;
        //else if (filterId == 'peaking2') this.enable.peaking2 = enable;
        //else if (filterId == 'highPass') this.enable.highPass = enable;
        let parent = this;
        
        setTimeout(function(){ parent.getFrequencyResponse(),50});
    }
    
    getEnable(filterId) {
        return this.settings?.[filterId].enable;
    }

    setAll(filterId,enable,frequency,q,gain) {
        if (game.user.isGM) {
            const payload = {
              "msgType": "eqSetAll",
              "channelNr": this.channel.settings.channel,
              filterId,
              enable,
              frequency
            };
            game.socket.emit(`module.Soundscape`, payload);
        }
        this.setEnable(filterId,enable);
        this.setFrequency(filterId,frequency);
        this.setQ(filterId,q);
        if (gain != undefined) this.setGain(filterId,gain);
    }

    getThisNode(thisNode) {
        if (thisNode == 'lowPass') return this.lowPass;
        else if (thisNode == 'peaking1') return this.peaking1;
        else if (thisNode == 'peaking2') return this.peaking2;
        else if (thisNode == 'highPass') return this.highPass;
    }

    getNextNode(thisNode) {
        if (thisNode == 'highPass') {
            if (this.settings.peaking1.enable) return this.peaking1;
            else if (this.settings.peaking2.enable) return this.peaking2;
            else if (this.settings.lowPass.enable) return this.lowPass;
            else return this.gain;
        }
        else if (thisNode == 'peaking1') {
            if (this.settings.peaking2.enable) return this.peaking2;
            else if (this.settings.lowPass.enable) return this.lowPass;
            else return this.gain;
        }
        else if (thisNode == 'peaking2') {
            if (this.settings.lowPass.enable) return this.lowPass;
            else return this.gain;
        }
        else if (thisNode == 'lowPass') {
            return this.gain;
        }
    }

    getPreviousNode(thisNode) {
        if (thisNode == 'highPass') return this.channel.effects.gain.node;
        else if (thisNode == 'peaking1') {
            if (this.settings.highPass.enable) return this.highPass;
            else return this.channel.effects.gain.node;
        }
        else if (thisNode == 'peaking2') {
            if (this.settings.peaking1.enable) return this.peaking1;
            else if (this.settings.highPass.enable) return this.highPass;
            else return this.channel.effects.gain.node;
        }
        else if (thisNode == 'lowPass') {
            if (this.settings.peaking2.enable) return this.peaking2;
            else if (this.settings.peaking1.enable) return this.peaking1;
            else if (this.settings.highPass.enable) return this.highPass;
            else return this.channel.effects.gain.node;
        }
    }

}