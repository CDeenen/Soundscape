export function getTimeStamp(duration) {
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

export function getSeconds(timestamp){
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

function randomizeArray(array) {
    for (let i = array.length - 1; i >= 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
    return array;
}

/*
soundData = {
    playlistName,
    soundSelect,
    source,
    randomize
}

*/
export async function createSoundArray(soundData) {
    console.log('soundData',soundData)
    let soundArray = [];
    if (soundData.soundSelect == 'playlist_single') {
        const playlist = game.playlists.getName(soundData.playlistName);
        if (playlist == undefined) return;
        const sound = playlist.sounds.getName(soundData.soundName);
        if (sound == undefined) return;
        soundArray.push(sound.data.path)
        soundData.randomize = false;
    }
    else if (soundData.soundSelect == 'playlist_multi') {
        const playlist = game.playlists.getName(soundData.playlistName);
        if (playlist == undefined) return;
        
        //Add all sounds in playlist to array
        for (let sound of playlist.sounds) 
            soundArray.push(sound.data.path)  
    }
    else if (soundData.soundSelect == 'filepicker_single') {
        const source = soundData.source;
        const ret = await FilePicker.browse("data", source, {wildcard:true});
        const files = ret.files;

        //Add all sounds in playlist to array
        for (let file of files) 
            soundArray.push(file)
    }
    else if (soundData.soundSelect == 'filepicker_folder') {
        const source = soundData.source;
        const ret = await FilePicker.browse("data", source);
        const files = ret.files;

        //Add all sounds in playlist to array
        for (let file of files) 
        soundArray.push(file)
    }

    //Randomize array
    if (soundData.randomize) return randomizeArray(soundArray)
    else return soundArray;
}