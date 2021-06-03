export class Pan {
    constructor(pan) {
        this.pan = pan;
        this.node = new StereoPannerNode(game.audio.context, { pan: pan });
    }

    set(pan) {
        this.node.pan.value = pan;
        this.pan = pan;
    }
    
    get() {
        return this.pan;
    }
}