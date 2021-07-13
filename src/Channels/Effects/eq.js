/**
 * EQ class
 * Creates 4 equalizers
 */
export class EQ {
    constructor(channel,context) {
        this.context = context;
        this.channel = channel;         //stores the channel that this effect applies to
        this.anyEnable = false;         //will be true if any of the delays are enabled

        //Create filter and gain nodes
        this.highPass = context.createBiquadFilter();
        this.lowPass = context.createBiquadFilter();
        this.peaking1 = context.createBiquadFilter();
        this.peaking2 = context.createBiquadFilter();
        this.gain = context.createGain();

        //Create the eq settings
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

        //Create frequency array for the getFrequencyResponse function
        this.freqArray = new Float32Array(595);
        this.freqArray[0] = 20;
        for (let i=1; i<this.freqArray.length; i++) {
            const value = this.freqArray[i-1]*Math.pow(10,1/(this.freqArray.length/3))
            this.freqArray[i] = value
        }
    }

    /**
     * Initialize the eq effects
     * @param {object} settings
     */
    initialize(settings) {
        this.setAll('lowPass',settings.lowPass.enable,settings.lowPass.frequency,settings.lowPass.q)
        this.setAll('highPass',settings.highPass.enable,settings.highPass.frequency,settings.highPass.q)
        this.setAll('peaking1',settings.peaking1.enable,settings.peaking1.frequency,settings.peaking1.q,settings.peaking1.gain)
        this.setAll('peaking2',settings.peaking2.enable,settings.peaking2.frequency,settings.peaking2.q,settings.peaking2.gain)
    }

    /**
     * Set the frequency for one of the equalizers
     * @param {string} filterId     identifier for the eq to set ('lowpass', 'highpass', 'peaking1', 'peaking2')
     * @param {number} frequency    new frequency
     */
    async setFrequency(filterId,frequency) {

        //Send frequency settings to connected clients
        if (game.user.isGM) {
            const payload = {
              "msgType": "eqSetFrequency",
              "channelNr": this.channel.channelNr,
              filterId,
              frequency
            };
            game.socket.emit(`module.soundscape`, payload);
        }

        //Store the new frequency value in this.settings
        this.settings[filterId].frequency = frequency;

        //Set the new frequency
        await this.getThisNode(filterId).frequency.setValueAtTime(frequency,this.context.currentTime)

        //Update the frequency response for the spectrum analyzer
        let parent = this;
        setTimeout(function(){ parent.getFrequencyResponse(),100});
    }

    

    /**
     * Set the quality factor for one of the equalizers
     * @param {number} filterId         identifier for the eq to set ('lowpass', 'highpass', 'peaking1', 'peaking2')
     * @param {number} qualityFactor    new q
     */
    setQ(filterId,qualityFactor) {

        //Send q settings to connected clients
        if (game.user.isGM) {
            const payload = {
              "msgType": "eqSetQ",
              "channelNr": this.channel.channelNr,
              filterId,
              qualityFactor
            };
            game.socket.emit(`module.soundscape`, payload);
        }
        
        //Store the new q value in this.settings
        this.settings[filterId].q = qualityFactor;
       
        //Set the new q
        this.getThisNode(filterId).Q.value=qualityFactor;

        //Update the frequency response for the spectrum analyzer
        let parent = this;
        setTimeout(function(){ parent.getFrequencyResponse(),100});
    }

    /**
     * Set the gain for one of the equalizers. Only works for the peaking filters
     * @param {number} filterId     identifier for the eq to set ('peaking1', 'peaking2')
     * @param {number} gain         new gain
     */
    setGain(filterId,gain) {

        //Send gain settings to connected clients
        if (game.user.isGM) {
            const payload = {
              "msgType": "eqSetGain",
              "channelNr": this.channel.channelNr,
              filterId,
              gain
            };
            game.socket.emit(`module.soundscape`, payload);
        }

        //Store the new gain value in this.settings
        this.settings[filterId].gain = gain;

        //Set the new gain
        this.getThisNode(filterId).gain.setValueAtTime(gain,this.context.currentTime);

        //Update the frequency response for the spectrum analyzer
        let parent = this;
        setTimeout(function(){ parent.getFrequencyResponse(),100});
    }

    /**
     * Enable or disable one of the equalizers
     * @param {string} filterId     identifier for the eq to set ('lowpass', 'highpass', 'peaking1', 'peaking2')
     * @param {bool} enable 
     */
    setEnable(filterId,enable) {

        //Send enable settings to the connected clients
        if (game.user.isGM) {
            const payload = {
              "msgType": "eqSetEnable",
              "channelNr": this.channel.channelNr,
              filterId,
              enable
            };
            game.socket.emit(`module.soundscape`, payload);
        }
        
        //Connect or disconnect the equalizer nodes
        if (enable) {
            this.anyEnable = true;
            this.getPreviousNode(filterId).disconnect();
            this.getPreviousNode(filterId).connect(this.getThisNode(filterId)).connect(this.getNextNode(filterId));
        }
        else if (this.getEnable(filterId)) {
            this.getPreviousNode(filterId).disconnect(this.getThisNode(filterId));
            this.getPreviousNode(filterId).connect(this.getNextNode(filterId));
        }

        //Store the new enable stat in this.settings
        this.settings[filterId].enable = enable;

        //Update the frequency response for the spectrum analyzer
        let parent = this;
        setTimeout(function(){ parent.getFrequencyResponse(),50});
    }
    
    /**
     * 
     * @param {string} filterId     identifier for the eq to set ('lowpass', 'highpass', 'peaking1', 'peaking2')
     * @returns                     returns the enable state of the specified equalizer
     */
    getEnable(filterId) {
        return this.settings?.[filterId].enable;
    }

    /**
     * Sets all the settings for the specified equalizer
     * @param {string} filterId     identifier for the eq to set ('lowpass', 'highpass', 'peaking1', 'peaking2')
     * @param {bool} enable         enable state of the eq (true/false)
     * @param {number} frequency    frequency of the eq
     * @param {number} q            quality factor of the eq
     * @param {number} gain         gain of the eq
     */
    setAll(filterId,enable,frequency,q,gain) {

        //Send eq settings to the connected clients
        if (game.user.isGM) {
            const payload = {
              "msgType": "eqSetAll",
              "channelNr": this.channel.channelNr,
              filterId,
              enable,
              frequency
            };
            game.socket.emit(`module.soundscape`, payload);
        }

        //Set the enable state, frequency, q and gain of the equalizer
        this.setEnable(filterId,enable);
        this.setFrequency(filterId,frequency);
        this.setQ(filterId,q);
        if (gain != undefined) this.setGain(filterId,gain);
    }

    /**
     * 
     * @param {*} thisNode 
     * @returns 
     */
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

    /**
     * Generates the frequency response of the equalizers and creates an overlay for the spectrum analyzer
     * @returns 
     */
     async getFrequencyResponse() {

        //Check if fxConfig is open
        if ($(`#fxConfig-${this.channel.channelNr+1}`)[0] == undefined) return;

        //Search for the freqResponse canvas
        let canvas = document.getElementById("freqResponse");
        if (this.anyEnable == false) return;
        if (canvas == undefined) return;
        let canvasCtx = canvas.getContext("2d");
        
        //Storage array for all equalizers
        var lowPassMagResponse = new Float32Array(this.freqArray.length);
        var highPassMagResponse = new Float32Array(this.freqArray.length);
        var peaking1MagResponse = new Float32Array(this.freqArray.length);
        var peaking2MagResponse = new Float32Array(this.freqArray.length);
        var phaseResponse = new Float32Array(this.freqArray.length);

        //For each eq, if that eq is enabled, get the frequency response, otherwise set it to 1
        if (this.settings.highPass.enable) this.highPass.getFrequencyResponse(this.freqArray,highPassMagResponse,phaseResponse);
        else for (let i=0; i<this.freqArray.length; i++) highPassMagResponse[i] = 1;
        if (this.settings.lowPass.enable) this.lowPass.getFrequencyResponse(this.freqArray,lowPassMagResponse,phaseResponse);
        else for (let i=0; i<this.freqArray.length; i++) lowPassMagResponse[i] = 1;
        if (this.settings.peaking1.enable) this.peaking1.getFrequencyResponse(this.freqArray,peaking1MagResponse,phaseResponse);
        else for (let i=0; i<this.freqArray.length; i++) peaking1MagResponse[i] = 1;
        if (this.settings.peaking2.enable) this.peaking2.getFrequencyResponse(this.freqArray,peaking2MagResponse,phaseResponse);
        else for (let i=0; i<this.freqArray.length; i++) peaking2MagResponse[i] = 1;
        
        //Create offsets to display the response properly, relative to the parent div
        let horOffset = 25;
        let vertOffset = 20;
        
        //Clear the old response
        canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

        //Set the drawing settings
        canvasCtx.lineWidth = 1;
        canvasCtx.globalAlpha = 0.75;
        canvasCtx.beginPath();
        canvasCtx.strokeStyle = "red";
        canvasCtx.lineWidth = 1;

        //Draw the response on the canvas
        for (var i = 0; i < canvas.width; ++i) {
            
            //For each frequency, multiply the response of all equalizers to get the combined response
            var response = (lowPassMagResponse[i] * highPassMagResponse[i] * peaking1MagResponse[i] * peaking2MagResponse[i]);

            //Do some math to get a log/log plot using a decibel scale
            response = 20.0 * Math.log(response) / Math.LN10;
            let dbScale = 30;
            const height = canvas.height-vertOffset;
            let y = (0.5 * height) - (0.5 * height) / dbScale * response;
            if (y>height) y = height;
            var x = i*canvas.width/this.freqArray.length + horOffset;

            //Draw new point on the canvas
            if ( i == 0 ) {
                canvasCtx.moveTo(x, y);
            } 
            else {
                canvasCtx.lineTo(x, y);
            }
        }
        canvasCtx.stroke();
    }

    /**
     * Get the frequency value within the frequency array
     * @param {string} frequency        frequency at which you want the value
     * @param {number array} dataArray  array containing the frequency data
     * @returns                         value at the specified frequency
     */
     getFrequencyValue(frequency,dataArray) {
        var nyquist = this.node.context.sampleRate/2;
        var index = Math.round(frequency/nyquist * this.node.frequencyBinCount);
        return dataArray[index];
    }
}