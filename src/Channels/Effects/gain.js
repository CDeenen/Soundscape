export class Gain {
    constructor(gain,context) {
        // super(data, options);
        this.context = context;
        this.gain = gain;
        this.node = context.createGain();
        this.node.gain.setValueAtTime(gain, context.currentTime);
    }

    set(gain) {
        if (gain > 1.25) gain = 1.25;
        else if (gain < 0) gain = 0;
        this.node.gain.setValueAtTime(gain, this.context.currentTime);
        this.gain = gain;
    }
    
    get() {
        return this.gain;
    }

    fadeIn() {

    }
}