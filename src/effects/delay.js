/**
 * Delay class
 * Creates a delay effect
 */
export class Delay {
    constructor(channel) {
        this.channel = channel;
        this.enable = false;
        this.delay = 0;
        this.delayVolume = 100;

        //Create delay and gain nodes
        this.node = game.audio.context.createDelay(0.5);
        this.gainNode = game.audio.context.createGain();

        //Wait 100ms, then initialize the settings
        let parent = this;
        setTimeout(function(){
            parent.initialize(parent.channel.settings.effects.delay);
        }, 100);
    }

    /**
     * Initialize the delay effect
     * @param {object} settings     delay settings: settings = {delayvolume, volume, enable}
     */
    initialize(settings) {
        this.setDelay(settings.delayTime);
        this.setVolume(settings.volume/100);
        this.setEnable(settings.enable);
    }

    /**
     * Enable or disable the delay
     * @param {bool} enable
     */
    setEnable(enable) {

        //Send delay settings to connected clients
        if (game.user.isGM) {
            const payload = {
              "msgType": "delaySetEnable",
              "channelNr": this.channel.settings.channel,
              enable
            };
            game.socket.emit(`module.Soundscape`, payload);
        }

        //Connect or disconnect delay nodes
        if (enable) 
            this.channel.effects.eq.gain.connect(this.node).connect(this.gainNode).connect(this.channel.effects.pan.node);
        else
            this.channel.effects.eq.gain.disconnect(this.node)

        //Store new enable state in this.enable
        this.enable = enable;
    }

    /**
     * Set the delay time
     * @param {number} delay    delaytime in seconds (0-0.5)
     */
    setDelay(delay) {

        //Send delay settings to connected clients
        if (game.user.isGM) {
            const payload = {
              "msgType": "delaySetDelay",
              "channelNr": this.channel.settings.channel,
              delay
            };
            game.socket.emit(`module.Soundscape`, payload);
        }

        //Set the delay time
        this.node.delayTime.setValueAtTime(delay,game.audio.context.currentTime);

        //Store new delay time in this.delay
        this.delay = delay;
    }

    /**
     * Set the volume settings of the delay
     * @param {number} volume   volume of the delay (0-1)
     */
    setVolume(volume) {

        //Send delay volume settings to connected clients
        if (game.user.isGM) {
            const payload = {
              "msgType": "delaySetVolume",
              "channelNr": this.channel.settings.channel,
              volume
            };
            game.socket.emit(`module.Soundscape`, payload);
        }

        //Set the delay volume
        this.gainNode.gain.setValueAtTime(volume,game.audio.context.currentTime);

        //Store new volulme in this.delayVolume
        this.delayVolume = volume;
    }
}