export class PlaybackRate {
    constructor(channel) {
       // super(data, options);
        
        this.channel = channel;
        this.rate = channel.settings.effects.playbackRate.rate;
    }

    set(rate) {
        if (this.channel.soundNode == undefined || this.channel.soundNode.node == undefined) return
        if (game.user.isGM) {
            const payload = {
              "msgType": "setPlaybackRate",
              "channelNr": this.channel.settings.channel,
              rate
            };
            game.socket.emit(`module.Soundscape`, payload);
        }

        this.channel.soundNode.node.playbackRate.value = rate;
        this.rate = rate;
    }
    
    get() {
        return this.rate;
    }

}