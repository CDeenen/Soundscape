import { moduleName } from "../../soundscape.js";
import { verifyPath, fileExists } from "./helpers.js";
import {helpMenuImport} from "../Help/helpMenus.js";

export class importConfigForm extends FormApplication {
    totalFiles = 0;
    importLocation;
    importCounter = 0;
    importCounterCheck = 0;
    notImportedCounter = 0;
    errorCounter = 0;
    progressDialog;
    uploadEvent;

    constructor(data, options) {
        super(data, options);
        this.parent;
    }

    /**
     * Default Options for this FormApplication
     */
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            id: "Soundscape_Import",
            title: "Soundscape: " + game.i18n.localize("Soundscape.Import"),
            template: "./modules/soundscape/src/Misc/importDialog.html",
            width: 500,
            height: "auto"
        });
    }

    setData(parent) {
        this.parent = parent;
    }

    /**
     * Provide data to the template
     */
    getData() {
        return {

        } 
    }

    /**
     * Update on form submit
     * @param {*} event 
     * @param {*} formData 
     */
    async _updateObject(event, formData) {
        let newData;
        if (this.uploadEvent == undefined) return;

        const fileList = this.uploadEvent.target.files;

        if (fileList[0].name.split('.')[1] == 'soundscapeData') {
            try {
                newData = await this.readJsonFile(fileList[0]); 
            } catch(err) {
                //console.log(err)
            }
            
        }   
        else if (fileList[0].name.split('.')[1] == 'soundscape')
            newData = await this.readSoundscapeFile(fileList[0]);
        else {
            ui.notifications.warn(game.i18n.localize("Soundscape.InvalidFormat"));
            return;
        }
        
        let soundscapes = game.settings.get(moduleName,'soundscapes');
        const newSoundscapes = soundscapes.concat(newData);
        await game.settings.set(moduleName,'soundscapes',newSoundscapes)
        this.parent.render(true);
    }

    activateListeners(html) {
        super.activateListeners(html);

        setTimeout(function() {
            document.getElementById('soundscape_importHelp').addEventListener("click", (event) => {
                let dialog = new helpMenuImport();
                dialog.render(true);
            })
        },100)

        const upload = html.find("input[id='uploadJson']");
        upload.on('change',(event) => {
            this.uploadEvent = event;
            event.preventDefault();
        })
    }

    async readJsonFile(jsonFile) {
        return new Promise((resolve, reject) => {
            let reader = new FileReader();
        
            reader.onload = () => {
              resolve(JSON.parse(reader.result));
            };
        
            reader.onerror = reject;
        
            reader.readAsText(jsonFile);
          })
    } 

    async readSoundscapeFile(file) {
        this.close();
        this.importLocation = 'soundscapes';

        let zip = new JSZip();
        zip = await this.readBlobFromFile(file).then(JSZip.loadAsync);
        
        const files = Object.values(zip.files)

        this.totalFiles = files.filter(f => f.comment == 'sound').length+files.filter(f => f.comment == 'image').length;

        let configFile = JSON.parse(await zip.file('data.json').async("text"));
        
        this.progressDialog = new Dialog({
            title: game.i18n.localize("Soundscape.ImportDialog.Title"),
            content: `
                <br>
                <div id="importProgress" style="display:flex">
                    <div id="importProgressBar" style="width:95%;height:10px;background-color:grey">
                        <div id="importBar" style="width:0%;height:100%;background-color:green"></div>  
                    </div>
                    &nbsp;
                    <div id="importProgressNumber">0%</div>
                </div>
            `,
            buttons: {},
            close: ''
        })
        this.progressDialog.render(true);

        //Check if importlocation exists, if not, create it
        await verifyPath(this.importLocation);
        await verifyPath(`${this.importLocation}/images`);
        await verifyPath(`${this.importLocation}/sounds`);

        for (let iSS=0; iSS<configFile.length; iSS++) {
            let soundscape = configFile[iSS];
            
            await this.uploadSounds(files,soundscape,soundscape.soundboard,iSS,'soundboard');
            await this.uploadSounds(files,soundscape,soundscape.channels,iSS,'channels');
        }
       this.progressDialog.close();
        return configFile;
    }

    async uploadSounds(files,soundscape,soundData,soundscapeNr,type) {
        for (let iCh=0; iCh<soundData.length; iCh++) {
            if (document.getElementById('importBar') != null) {
                const percentage = Math.ceil(100*this.importCounter/this.totalFiles);
                document.getElementById('importBar').style.width = `${percentage}%`;
                document.getElementById('importProgressNumber').innerHTML = `${percentage}%`;
            }
                
            let channel = type == 'soundboard' ? soundData[iCh] : soundData[iCh].soundData;
            if (channel == null || channel == undefined) continue;
            const sourcePath = `${soundscapeNr+1}-${soundscape.name}/${type}/${iCh+1}-${soundData[iCh].name}`;
            const newFiles = files.filter(f => f.name.includes(sourcePath));
            const newSounds = newFiles.filter(f => f.comment == 'sound');
            const newImage = newFiles.filter(f => f.comment == 'image')[0];
            const targetPath = channel.source;

            this.importCounter += newSounds.length;

            if (newImage != undefined) { 
                if (await fileExists(channel.imageSrc)) {
                    console.warn(`Image '${channel.imageSrc}' exists. Not uploaded.`);
                    this.importCounter++;
                    this.notImportedCounter++;
                    //document.getElementById('notImportedNum').innerHTML = this.notImportedCounter;
                }
                else {
                    const split = newImage.name.split('/');
                    const name = split[split.length-1];
                    const path = `${this.importLocation}/images`;
                    this.importCounter++;
                    await this.uploadFile(newImage,name,path);
                    channel.imageSrc = `${path}/${name}`;
                }
            }
            
            if (channel.soundSelect == 'playlist_single') {
                //Check if playlist and sound exist, if so: continue
                const playlist = game.playlists.getName(channel.playlistName);
                if (playlist != undefined) {
                    const sound = playlist.sounds.getName(channel.soundName);
                    if (sound != undefined) {
                        console.warn(`File '${sound.name}' exists in playlist '${playlist.name}'. Not uploaded.`); 
                        this.notImportedCounter += newSounds.length;
                        //document.getElementById('notImportedNum').innerHTML = this.notImportedCounter;
                        continue;
                    }
                }
                const path = `${this.importLocation}/sounds`;
                let name = '';
                for (let sound of newSounds) {
                    const split = sound.name.split('/');
                    name = split[split.length-1];     
                    await this.uploadFile(sound,name,path);
                }  
                channel.soundSelect = 'filepicker_single';
                channel.source = `${path}/${name}`;
            }
            else if (channel.soundSelect == 'playlist_multi') {
                
                //Check if playlist exists, if so: continue
                const playlist = game.playlists.getName(channel.playlistName);
                if (playlist != undefined) {
                    console.warn(`Playlist '${playlist.name}' exists. Not uploaded.`);
                    this.notImportedCounter += newSounds.length;
                    //document.getElementById('notImportedNum').innerHTML = this.notImportedCounter;
                    continue;
                }
                let playlistName = channel.playlistName;
                if (playlistName == '') continue;
                const path = `${this.importLocation}/sounds/${playlistName}`;
                await verifyPath(path);
                for (let sound of newSounds) {
                    const split = sound.name.split('/');
                    let name = `${playlistName}/${split[split.length-1]}`;     
                    await this.uploadFile(sound,name,path);
                }  
                channel.soundSelect = 'filepicker_folder';
                channel.source = path;
            }
            else if (channel.soundSelect == 'filepicker_single') {
                if (await fileExists(targetPath)) {
                    console.warn(`File '${targetPath}' exists. Not uploaded.`);
                    this.notImportedCounter += newSounds.length;
                    //document.getElementById('notImportedNum').innerHTML = this.notImportedCounter;
                    continue;
                }
                const split = targetPath.split('/');
                let folderName = split[split.length-1];
                const path = `${this.importLocation}/sounds`;
                for (let sound of newSounds) {
                    const split = sound.name.split('/');
                    let name = `${split[split.length-1]}`;     
                    await this.uploadFile(sound,name,path);
                }  
                channel.source = `${path}/${folderName}`;
            }
            else if (channel.soundSelect == 'filepicker_folder') {
                if (await fileExists(targetPath,true)) {
                    console.warn(`File '${targetPath}' exists. Not uploaded.`);
                    this.notImportedCounter += newSounds.length;
                    //document.getElementById('notImportedNum').innerHTML = this.notImportedCounter;
                    continue;
                }

                const split = targetPath.split('/');
                let folderName = split[split.length-1];
                const path = `${this.importLocation}/sounds/${folderName}`;
                await verifyPath(path);
                for (let sound of newSounds) {
                    const split = sound.name.split('/');
                    let name = `${split[split.length-1]}`;     
                    await this.uploadFile(sound,name,path);
                }  
                channel.source = path;
            }
        }
    }

    async uploadFile(file,name,path) {
        if (await fileExists(`${path}/${name}`)) {
            console.warn(`File '${name}' exists in '${path}'. Not uploaded.`);
            this.notImportedCounter++;
            //document.getElementById('notImportedNum').innerHTML = this.notImportedCounter;
            return 2;
        }
        const image = await file.async("uint8array");
        const newFile = new File([image], name);
        
        const options = { bucket: null };
        // Create the form data to post
        const fd = new FormData();
        fd.set("source", "data");
        fd.set("target", path);
        fd.set("upload", newFile);
        Object.entries(options).forEach(o => fd.set(...o));

        // Dispatch the request
        const request = await fetch(FilePicker.uploadURL, {method: "POST", body: fd});
        if ( request.status === 413 ) {
            console.warn(`File '${name}' in '${path}' is too large. Not uploaded.`);
            this.errorCounter++;
            //document.getElementById('errorNum').innerHTML = this.errorCounter;
            return 0;
        }

        // Attempt to obtain the response
        const response = await request.json().catch(() => { return {} });
        if (response.error) {
            ui.notifications.error(response.error);
            this.errorCounter++;
            //document.getElementById('errorNum').innerHTML = this.errorCounter;
            return false;
        }
        else if ( !response.path ) {
            console.warn(`File '${name}' in '${path}' failed to upload.`);
            this.errorCounter++;
            //document.getElementById('errorNum').innerHTML = this.errorCounter;
            return 0;
        }

        this.importCounterCheck++;
        document.getElementById('importProgressNumber').innerHTML = this.importCounterCheck;
        return 1;
    }

    

    

    readBlobFromFile(file) {
        const reader = new FileReader();
        return new Promise((resolve, reject) => {
          reader.onload = ev => {
            resolve(reader.result);
          };
          reader.onerror = ev => {
            reader.abort();
            reject();
          };
          reader.readAsBinaryString(file);
        });
      }


}