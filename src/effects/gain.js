export class Gain {
    constructor(gain) {
       // super(data, options);
        this.gain = gain;
        this.node = game.audio.context.createGain();
        this.node.gain.setValueAtTime(gain, game.audio.context.currentTime);
    }

    set(gain) {
        if (gain > 1.25) gain = 1.25;
        else if (gain < 0) gain = 0;
        this.node.gain.setValueAtTime(gain, game.audio.context.currentTime);
        this.gain = gain;
    }
    
    get() {
        return this.gain;
    }

    fadeIn() {

    }
}