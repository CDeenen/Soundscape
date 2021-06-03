export class MixerHelpers {

    channel;

    setChannel(ch) {
        this.channel = ch;
    }

    getThisNode(thisNode) {
        let channelStrip = this.parent.sounds[this.channel];
        if (thisNode == 'lp') return channelStrip.lowPass;
        else if (thisNode == 'pf1') return channelStrip.peaking1;
        else if (thisNode == 'pf2') return channelStrip.peaking2;
        else if (thisNode == 'hp') return channelStrip.highPass;
        else if (thisNode == 'delay') return channelStrip.delay;
    }

    getNextNode(thisNode) {
        let channelStrip = this.parent.sounds[this.channel];
        if (thisNode == 'lp') {
            if (this.filters[1].enable) return channelStrip.peaking1;
            else if (this.filters[2].enable) return channelStrip.peaking2;
            else if (this.filters[3].enable) return channelStrip.highPass;
            else if (this.delayEnable) return channelStrip.delay;
            else return channelStrip.panner;
        }
        else if (thisNode == 'pf1') {
            if (this.filters[2].enable) return channelStrip.peaking2;
            else if (this.filters[3].enable) return channelStrip.highPass;
            else if (this.delayEnable) return channelStrip.delay;
            else return channelStrip.panner;
        }
        else if (thisNode == 'pf2') {
            if (this.filters[3].enable) return channelStrip.highPass;
            else if (this.delayEnable) return channelStrip.delay;
            else return channelStrip.panner;
        }
        else if (thisNode == 'hp') {
            if (this.delayEnable) return channelStrip.delay;
            else return channelStrip.panner;
        }
        else if (thisNode == 'delay') {
            return channelStrip.panner;
        }
    }

    getPreviousNode(thisNode) {
        let channelStrip = this.parent.sounds[this.channel];
        if (thisNode == 'lp') return channelStrip.sound.node;
        else if (thisNode == 'pf1') {
            if (this.filters[0].enable) return channelStrip.lowPass;
            else return channelStrip.sound.node;
        }
        else if (thisNode == 'pf2') {
            if (this.filters[1].enable) return channelStrip.peaking1;
            else if (this.filters[0].enable) return channelStrip.lowPass;
            else return channelStrip.sound.node;
        }
        else if (thisNode == 'hp') {
            if (this.filters[2].enable) return channelStrip.peaking2;
            else if (this.filters[1].enable) return channelStrip.peaking1;
            else if (this.filters[0].enable) return channelStrip.lowPass;
            else return channelStrip.sound.node;
        }
        else if (thisNode == 'delay') {
            if (this.filters[3].enable) return channelStrip.highPass;
            if (this.filters[2].enable) return channelStrip.peaking2;
            else if (this.filters[1].enable) return channelStrip.peaking1;
            else if (this.filters[0].enable) return channelStrip.lowPass;
            else return channelStrip.sound.node;
        }
    }

    getTimeStamp(duration) {
        let hours = Math.floor(duration/3600);
        let remainder = duration%3600;
        let minutes = Math.floor(remainder/60);
        remainder = remainder%60;
        let seconds = Math.floor(remainder);
        remainder = remainder%1
        let milliseconds = Math.floor(remainder*1000);

        if (hours < 10) hours = "0"+hours;
        if (minutes < 10) minutes = "0"+minutes;
        if (seconds < 10) seconds = "0"+seconds;
        if (milliseconds < 10) milliseconds = "00"+milliseconds;
        else if (milliseconds < 100) milliseconds = "0"+milliseconds;
        return hours+":"+minutes+":"+seconds+"."+milliseconds;
    }

    getSeconds(timestamp){
        let timeArray = timestamp.split('.');
        const millis = parseInt(timeArray[1]);
        timeArray = timeArray[0].split(':');
        const hours = parseInt(timeArray[0]);
        const minutes = parseInt(timeArray[1]);
        const seconds = parseInt(timeArray[2]);
        if ((hours<0||hours>99) || (minutes<0||minutes>59) || (seconds<0||seconds>59) || (millis<0||millis>999)) {
            ui.notifications.error("Invalid timestamp");
            return false;
        }
        return hours*3600+minutes*60+seconds+millis/1000;
    }
}