import {helpMenuExport} from "../Help/helpMenus.js";

export class exportConfigForm extends FormApplication {
    progressDialog;
    
    constructor(data, options) {
        super(data, options);
        this.data = {};
    }

    /**
     * Default Options for this FormApplication
     */
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            id: "Soundscape_Export",
            title: "Soundscape: " + game.i18n.localize("Soundscape.Export"),
            template: "./modules/Soundscape/src/Misc/exportDialog.html",
            width: 500,
            height: "auto"
        });
    }

    setData(data) {
        this.data = data;
    }

    /**
     * Provide data to the template
     */
    getData() {
        return {
            data: this.data,
            number: this.data.length
        } 
    }

    /**
     * Update on form submit
     * @param {*} event 
     * @param {*} formData 
     */
    async _updateObject(event, formData) {
        if (formData.files) {
            this.progressDialog = new Dialog({
                title: game.i18n.localize("Soundscape.ExportDialog.Title"),
                content: `
                    <br>
                    <div id="exportProgress" style="display:flex">
                        <div id="exportProgressBar" style="width:95%;height:10px;background-color:grey">
                            <div id="exportBar" style="width:0%;height:100%;background-color:green"></div>  
                        </div>
                        &nbsp;
                        <div id="exportProgressNumber">0%</div>
                    </div>
                `,
                buttons: {},
                close: ''
            })
            this.progressDialog.render(true);
            this.exportZip(this.data,formData.name);
        }
        else this.download(this.data,formData.name)
    }

    activateListeners(html) {
        super.activateListeners(html);

        setTimeout(function() {
            document.getElementById('soundscape_exportHelp').addEventListener("click", (event) => {
                let dialog = new helpMenuExport();
                dialog.render(true);
            })
        },100)
    }

    download(data,name) {
        let dataStr = JSON.stringify(data);
        let dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        let exportFileDefaultName = `${name}.soundscapeData`;
        let linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    }

    soundCounter = 0;
    soundCounterCheck = 0;

    async exportZip(data,name) {
        let zip = new JSZip();

        //Create main json file
        zip.file('data.json',JSON.stringify(data));
 
        this.soundCounter = 0;
        this.soundCounterCheck = 0;

        for (let i=0; i<data.length; i++) {
            const soundscape = data[i];
            let folderPath = `${i+1}-${soundscape.name}`;
            
            //Create folder and json file
            zip.folder(folderPath).file('data.json',JSON.stringify(soundscape));

            //Create folder and json file
            zip.folder(`${folderPath}/soundboard`).file('data.json',JSON.stringify(soundscape.soundboard));

            for (let i=0; i<soundscape.soundboard.length; i++) {
                const sound = soundscape.soundboard[i];
                const soundName = sound == undefined ? '' : sound.name;
                //Create folder and json file
                zip.folder(`${folderPath}/soundboard/${i+1}-${soundName}`).file('data.json',JSON.stringify(sound));

                if (sound != null || sound != undefined) {
                    if (this.getSoundFiles(sound,`${folderPath}/soundboard/${i+1}-${soundName}`,zip,name) == false) continue;
                    
                    if (sound.imageSrc != undefined && sound.imageSrc != null && sound.imageSrc != "") {
                        this.soundCounterCheck++;
                        this.addFileToZip(zip,sound.imageSrc,`${folderPath}/soundboard/${i+1}-${soundName}`,name,'image');
                    }
                }
            }
            
            for (let i=0; i<soundscape.channels.length; i++) {
                const channel = soundscape.channels[i];
                const channelName = channel == undefined ? '' : channel.name;

                //Create folder and json file
                zip.folder(`${folderPath}/channels/${i+1}-${channelName}`).file('data.json',JSON.stringify(channel));

                if (channel != null || channel != undefined) {
                    if (this.getSoundFiles(channel.soundData,`${folderPath}/channels/${i+1}-${channelName}`,zip,name) == false) continue;
                }
            }
        }
    }

    async getSoundFiles(sound,folderPath,zip,name) {
        let data = {files:[]};
        if (sound.soundSelect == 'filepicker_single') {
            if (sound.source == "") return false;
            data = await FilePicker.browse("data", sound.source, {wildcard:true});
        }
        else if (sound.soundSelect == 'filepicker_folder') {
            if (sound.source == "") return false;
            data = await FilePicker.browse("data", sound.source);
        }
        else if (sound.soundSelect == 'playlist_single') {
            if (sound.playlistName =="" || sound.soundName == "") return false;
            const pl = game.playlists.getName(sound.playlistName);
            if (pl != undefined) {
                const s = pl.sounds.getName(sound.soundName);
                if (s != undefined) {
                    data = {files:[s.path]};
                }
            }
                
        }
        else if (sound.soundSelect == 'playlist_multi') {
            if (sound.playlistName =="") return false;
            const pl = game.playlists.getName(sound.playlistName);
            if (pl != undefined) {
                let files = [];
                for (let s of pl.sounds) {
                    files.push(s.path);
                }
                data = {files};
            }
        }

        const files = data.files;

        if (files.length > 0) {
            this.soundCounterCheck += files.length;
            for (let path of files)
                this.addFileToZip(zip,path,folderPath,name,'sound');
        }

        return true;
    }

    addFileToZip(zip,path,folder,ssName,comment) {
        let parent = this;
        JSZipUtils.getBinaryContent(path, function (err, data) {
            if(err) {
                throw err; // or handle the error
            }
            const split = path.split('/');
            const name = `${folder}/${split[split.length-1]}`;
            zip.file(name, data, {binary:true, comment});

            parent.soundCounter++;

            if (parent.soundCounterCheck == parent.soundCounter) {
                zip.generateAsync({type:"blob"}, function updateCallback(metadata) {
                    if (document.getElementById("exportBar") != null) {
                        const percentage = metadata.percent;
                        if (percentage == 100) {
                            parent.progressDialog.close();
                            return;
                        }
                        let bar = document.getElementById("exportBar");
                        bar.style.width = percentage + "%";
                        let number = document.getElementById("exportProgressNumber");
                        number.innerHTML = Math.floor(percentage) + "%";
                    }
                })
                .then(function(content) {
                    // see FileSaver.js
                    saveAs(content, `${ssName}.soundscape`);
                });
            }
            
        });
    }
}