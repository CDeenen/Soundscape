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

/**
 * Get data in a folder
 * @param {String} path         path to the folder
 * @param {String} dataType     data type to filder ('any','audio')
 * @param {Boolean} recursive   search recursively (also search subfolders)
 * @returns                     folderstructure object
 */
export async function getDataInFolder(path, dataType, recursive = false) {

    //Get base folder
    const ret = await FilePicker.browse("data", path);

    //Split path and grab last element to get the folder name
    const split = path.split('/');
    const name = split[split.length-1];

    //Get the folders within this folder
    const dirs = ret.dirs;

    let folders = [];
    //Check if folder data should be checked recursively (also check subfolders)
    if (recursive) {
        for (let dir of dirs) {

            //For each folder, get contents
            const data = await getDataInFolder(dir,dataType,recursive);

            //If the folder contains other folders or files, append it to the folder array
            if (data.files.length > 0 || data.folders.length > 0) folders.push(data);
        }
    }
    else {
        folders = dirs;
    }
    
    //Filter files of the correct datatype
    let filesRaw = [];
    if (dataType == 'any') filesRaw = ret.files;
    else if (dataType == 'audio') filesRaw = ret.files.filter(isAudioFile);

    //Convert files to proper data structure
    let files = [];
    for (let file of filesRaw) {
        files.push({
            path: file,
            open: false
        });
    }

    //Create object to be returned
    const data = {
        folders,
        files,
        path:ret.target,
        name,
        open:false
    };
    return data;
}

//Formats to search for
const audioFormats = ['aac', 'aiff', 'flac', 'm4a', 'm4b', 'm4p', 'mp3', 'ogg', 'oga', 'mogg', 'opus', 'ra', 'rm', 'wav', 'wma'];

/**
 * Check if file is an audio file
 * @param {String} path     Path to the file
 * @returns                 Returns true if file is an audio file
 */
function isAudioFile(path) {
    //Split the path into sections, split by '.'
    const split = path.split('.');

    //Get the latest element to get the file format
    const format = split[split.length-1];

    //check if file format is included in the datatype array
    return audioFormats.includes(format);
}

export async function verifyPath(path) {
    try {
        await FilePicker.browse('data',path);
    } catch (error) {
        await FilePicker.createDirectory('data',path);
    }
}

export async function fileExists(path,folder = false) {
    let exists = true;
    let data;
    try {
        data = await FilePicker.browse('data',path,{wildcard:true});
    } catch (error) {
        exists = false;
    }
    finally {
        if (exists == false) return false;
        if(folder == false && data.files.length>0) return true;
        if(folder && data.dirs.length>0) return true;
        else return false;
    }
}