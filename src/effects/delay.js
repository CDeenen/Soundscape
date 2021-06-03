export class Delay {
    constructor(channel) {
        this.channel = channel;
        this.enable = false;
        this.delay = 0;
        this.delayVolume = 100;
        this.node = game.audio.context.createDelay(0.5);
        this.gainNode = game.audio.context.createGain();

        let parent = this;
        setTimeout(function(){
            parent.initialize(parent.channel.settings.effects.delay);
        }, 100);
    }

    initialize(settings) {
        this.setDelay(settings.delayTime);
        this.setVolume(settings.volume/100);
        this.setEnable(settings.enable);
    }

    setEnable(enable) {
        if (game.user.isGM) {
            const payload = {
              "msgType": "delaySetEnable",
              "channelNr": this.channel.settings.channel,
              enable
            };
            game.socket.emit(`module.Soundscape`, payload);
        }
        if (enable) {
            this.gain
            this.channel.effects.eq.gain.connect(this.node).connect(this.gainNode).connect(this.channel.effects.pan.node);
        }
        else if (this.enable) {
            this.channel.effects.eq.gain.disconnect(this.node)
        }
        this.enable = enable;
    }

    setDelay(delay) {
        if (game.user.isGM) {
            const payload = {
              "msgType": "delaySetDelay",
              "channelNr": this.channel.settings.channel,
              delay
            };
            game.socket.emit(`module.Soundscape`, payload);
        }
        this.node.delayTime.setValueAtTime(delay,game.audio.context.currentTime);
        this.delay = delay;
    }

    setVolume(volume) {
        if (game.user.isGM) {
            const payload = {
              "msgType": "delaySetVolume",
              "channelNr": this.channel.settings.channel,
              volume
            };
            game.socket.emit(`module.Soundscape`, payload);
        }
        this.gainNode.gain.setValueAtTime(volume,game.audio.context.currentTime);
        this.delayVolume = volume;
    }
}