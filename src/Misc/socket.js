import { mixer, activeUser } from "../../soundscape.js";

export async function socket(payload) {
    //console.log('payload',payload);
    if (mixer == undefined) return;
    if (activeUser && (payload.msgType == 'getSettings' || payload.msgType == 'getChannelSettings')) {
        let channels = [];
        for (let i=0; i<mixer.channels.length; i++) {
            const channel = mixer.channels[i];
            
            if (channel.node == undefined || channel.node.mediaElement == undefined) 
                channels.push({
                    source: '',
                    currentTime: undefined, 
                    playing: false,
                    settings: channel.settings,
                    soundData: channel.soundData,
                    sourceArray: [],
                    currentlyPlaying: channel.currentlyPlaying
                })
            else 
                channels.push({
                    source: channel.source,
                    currentTime: channel.node.mediaElement.currentTime,
                    playing: channel.playing,
                    settings: channel.settings,
                    soundData: channel.soundData,
                    sourceArray: channel.sourceArray,
                    currentlyPlaying: channel.currentlyPlaying
                })
        }
        let sbChannels = [];
        for (let i=0; i<25; i++) {
            const channel = mixer.soundboard.channels[i];
            sbChannels.push({
                settings: channel.settings,
                currentlyPlaying: channel.currentlyPlaying
            })
        }
        let soundboard = {
            channels: sbChannels,
            volume: mixer.soundboard.volume
        }
        const payload2 = {
            "msgType": "setSettings",
            "targetUserId": payload.userId,
            "channels": channels,
            "soundboard": soundboard,
            "sourceType": payload.msgType
        };
        game.socket.emit(`module.soundscape`, payload2);
    }
    else if (payload.msgType == 'setSettings' && (game.userId == payload.targetUserId || payload.targetUserId == 'all')) {
        
        if (payload.sourceType == "getChannelSettings") {
            for (let i=0; i<payload.channels.length; i++) {
                mixer.channels[i].setData(payload.channels[i])
            }
            for (let i=0; i<payload.soundboard.channels.length; i++) {
                mixer.soundboard.channels[i].setSbData(payload.soundboard.channels[i].settings,payload.currentlyPlaying)
            }     
        }
        else {
            for (let i=0; i<payload.channels.length; i++) {
                mixer.channels[i].setSource(payload.channels[i].source)
                if (payload.channels[i].playing) {
                    mixer.channels[i].play(payload.channels[i].currentTime);
                }
            }
            for (let i=0; i<payload.soundboard.channels.length; i++) {
                mixer.soundboard.channels[i].setSbData(payload.soundboard.channels[i].settings,payload.currentlyPlaying)
            } 
        }
        
    }
    else if (payload.msgType == 'soundConfig') {
        const channel = mixer.channels[payload.channel];
        channel.stop();
        channel.setData(payload.data);
    }
    else if (payload.msgType == 'sbSoundConfig') {
        const channel = mixer.soundboard.channels[payload.channel-100];
        channel.stop();
        channel.setSbData(payload.data);
    }

    else if (payload.msgType == 'start') {
        if (payload.channel >= 100) return;
        mixer.start(payload.channel);
    }
    else if (payload.msgType == 'next') {
        if (payload.channel >= 100) return;
       mixer.channels[payload.channel].next(payload.currentlyPlaying);
    }
    else if (payload.msgType == 'stop') mixer.stop(payload.channel,false,payload.force);
    else if (payload.msgType == 'setVolume' && payload.channelNr == "master") mixer.master.setVolume(payload.volume,payload.save);
    else if (payload.msgType == 'setVolume' && payload.channelNr < 100) mixer.channels[payload.channelNr].setVolume(payload.volume,payload.save);
    else if (payload.msgType == 'setVolume') mixer.soundboard.channels[payload.channelNr-100].setVolume(payload.volume,payload.save);
    else if (payload.msgType == 'setMute') (payload.channelNr == "master") ? mixer.master.setMute(payload.mute) : mixer.channels[payload.channelNr].setMute(payload.mute);
    else if (payload.msgType == 'stopAllSoundboard') mixer.soundboard.stopAll();
    if (payload.channelNr == 'master') return;
    else if (payload.channelNr < 100) {
        if (payload.msgType == 'setSolo') mixer.channels[payload.channelNr].setSolo(payload.solo);
        else if (payload.msgType == 'setPan') mixer.channels[payload.channelNr].setPan(payload.pan);
    
        else if (payload.msgType == 'eqSetEnable') mixer.channels[payload.channelNr].effects.eq.setEnable(payload.filterId,payload.enable);
        else if (payload.msgType == 'eqSetFrequency') mixer.channels[payload.channelNr].effects.eq.setFrequency(payload.filterId,payload.frequency);
        else if (payload.msgType == 'eqSetQ') mixer.channels[payload.channelNr].effects.eq.setQ(payload.filterId,payload.qualityFactor);
        else if (payload.msgType == 'eqSetGain') mixer.channels[payload.channelNr].effects.eq.setGain(payload.filterId,payload.gain);
        else if (payload.msgType == 'setPlaybackRate') mixer.channels[payload.channelNr].setPlaybackRate(payload.playbackRate);
        else if (payload.msgType == 'delaySetEnable') mixer.channels[payload.channelNr].effects.delay.setEnable(payload.enable);
        else if (payload.msgType == 'delaySetDelay') mixer.channels[payload.channelNr].effects.delay.setDelay(payload.delay);
        else if (payload.msgType == 'delaySetVolume') mixer.channels[payload.channelNr].effects.delay.setVolume(payload.volume);
    }
    else {
        if (payload.msgType == 'playSoundboard') mixer.soundboard.playSound(payload.channel, payload.players);
        else if (payload.msgType == 'setSoundboardVolume') mixer.soundboard.setVolume(payload.volume);
    }
    
}