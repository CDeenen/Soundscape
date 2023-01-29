import {moduleName} from "../../soundscape.js";
import {helpMenuSoundscapeConfig} from "../Help/helpMenus.js";
import { getDataInFolder, fileExists } from "./helpers.js";
import { exportConfigForm } from "./export.js";
import { importConfigForm } from "./import.js";

export class soundscapeConfig extends FormApplication {
    moduleList = ["soundfxlibrary","SoundBoard-BlitzFreePack","SoundBoard-BlitzCommunityPack"];

    constructor(data, options) {
        super(data, options);
        this.mixer;
        this.parent;
        this.soundscapes;
        this.tab = 'soundscapeConfig';
        this.playing;
    }

    setMixer(mixer,parent) {
        this.mixer = mixer;
        
        this.parent = parent;
    }
  
    /**
     * Default Options for this FormApplication
     */
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            id: "soundscape_soundscapeConfig",
            title: "Soundscape: " + game.i18n.localize("SOUNDSCAPE.Config"),
            template: "./modules/soundscape/src/Misc/soundscapeConfig.html",
            width: "500px",
            height: "700px"
        });
    }
  
    /**
     * Provide data to the template
     */
    async getData() {
        let allSoundscapes = game.settings.get(moduleName,'soundscapes')
        this.soundscapes = [];

        let iteration = 0;
        for (let i=0; i<allSoundscapes.length; i++)
            if (allSoundscapes[i] != null) {
                allSoundscapes[i].iteration = iteration;
                iteration++;
                allSoundscapes[i].number = iteration;
                this.soundscapes.push(allSoundscapes[i])
            }
        
        const playlists = [];
        
        for (let playlist of game.playlists) {
            let files = [];
            let playlistPath;
            for (let sound of playlist.sounds) {
                if (playlistPath == undefined) {
                    const split = sound.path.replaceAll('/','\\').split('\\');
                    playlistPath = split[0];
                    for (let i = 1; i<split.length-1; i++) playlistPath += '/' + split[i];
                }

                files.push({
                    path: sound.path,
                    soundId: sound.id,
                    playlistId: playlist.id,
                    open: false
                })
            }

            playlists.push({
                name: playlist.name,
                data: {
                    files,
                    folders: [],
                    name: playlist.name,
                    open: false,
                    path: playlistPath,
                    playlistId: playlist.id
                },
                path: playlistPath,
                playlistId: playlist.id
            })
        }
        
        let modules = [];

        for (let moduleName of this.moduleList) {    
            const moduleData = game.modules.get(moduleName);
            if (moduleData != undefined) {
                //const split = moduleData.path.replaceAll('/','\\').split('\\');
                const split = moduleData.scripts.first().replaceAll('/','\\').split('\\');
                //const path = `${split[split.length-2]}/${split[split.length-1]}`;
                const path = `${split[0]}/${split[1]}`;
                
                if (await fileExists(path,true) == false) continue;
                const data  = await getDataInFolder(path,"audio",true);
                modules.push({
                    name: moduleData.data.title,
                    data,
                    path
                })
            }
        }

        return {
            soundscapes: this.soundscapes,
            playlists,
            modules,
            playlistData: JSON.stringify(playlists),
            moduleData: JSON.stringify(modules)
        } 
    }
  
    /**
     * Update on form submit
     * @param {*} event 
     * @param {*} formData 
     */
    async _updateObject(event, formData) {
        
    }
  
    activateListeners(html) {
        super.activateListeners(html);

        setTimeout(function() {
            document.getElementById('soundscape_soundscapeConfigHelp').addEventListener("click", (event) => {
                let dialog = new helpMenuSoundscapeConfig();
                dialog.render(true);
            })
        },100)

        const name = html.find('input[name=name]');
        const load = html.find('button[name=load]')
        const moveUp = html.find('button[name=moveUp]');
        const moveDown = html.find('button[name=moveDown]');
        const copySoundboard = html.find('button[name=sbToSel]');
        const newSoundscape = html.find('button[name=new]');
        const selectAll = html.find('button[name=selectAll]');
        const deselectAll = html.find('button[name=deselectAll]');
        const deleteSelected = html.find('button[name=deleteSelected]');
        const copySelected = html.find('button[name=copySelected]');
        const exportSelected = html.find('button[name=exportSelected]');
        const importSelected = html.find('button[name=importSelected]');

        name.on('change', event => {
            const id = parseInt(event.currentTarget.id.replace('name-',''));
            let soundscapes = game.settings.get(moduleName,'soundscapes')
            soundscapes[id].name = event.currentTarget.value;
            game.settings.set(moduleName,'soundscapes',soundscapes);
        })
        load.on('click', event => {
            event.preventDefault();
            const id = parseInt(event.currentTarget.id.replace('load-',''));
            this.mixer.currentSoundscape = id;
            this.mixer.setSoundscape(id);
            this.close();
        })

        moveUp.on('click', async event => {
            const id = parseInt(event.currentTarget.id.replace('moveUp-',''));
            if (id == 0) return;
            let soundscapes = game.settings.get(moduleName,'soundscapes')
            const tempElement = soundscapes[id];
            soundscapes[id] = soundscapes[id-1];
            soundscapes[id-1] = tempElement;
            await game.settings.set(moduleName, 'soundscapes', soundscapes);
            this.render(true);
        })

        moveDown.on('click', async event => {
            const id = parseInt(event.currentTarget.id.replace('moveDown-',''));
            let soundscapes = game.settings.get(moduleName,'soundscapes')
            if (id >= soundscapes.length - 1) return;
            const tempElement = soundscapes[id];
            soundscapes[id] = soundscapes[id+1];
            soundscapes[id+1] = tempElement;
            await game.settings.set(moduleName, 'soundscapes', soundscapes);
            this.render(true);
        })

        copySoundboard.on('click', event => {
            const id = parseInt(event.currentTarget.id.replace('sbToSel-',''));
            let soundscapes = game.settings.get(moduleName,'soundscapes')
            const soundboard = soundscapes[id].soundboard;
            const soundboardGain = soundscapes[id].soundboardGain;
            for (let i=0; i<soundscapes.length; i++) 
                if (html.find(`input[id=select-${i}]`)[0].checked) {
                    soundscapes[i].soundboard = soundboard;
                    soundscapes[i].soundboardGain = soundboardGain;
                }
            game.settings.set(moduleName,'soundscapes',soundscapes);
            ui.notifications.info(`Soundscape: Soundboard copied to selected soundscapes`);
        })

        newSoundscape.on('click', async event => {
            const newSoundscape = this.mixer.newSoundscape();
            let soundscapes = game.settings.get(moduleName,'soundscapes');
            soundscapes.push(newSoundscape);
            await game.settings.set(moduleName,'soundscapes',soundscapes);
            this.render(true);
        })

        selectAll.on('click', event => {
            for (let i=0; i<this.soundscapes.length; i++) 
                html.find(`input[id=select-${i}]`)[0].checked = true;
        })

        deselectAll.on('click', event => {
            for (let i=0; i<this.soundscapes.length; i++) 
                html.find(`input[id=select-${i}]`)[0].checked = false;
        })

        deleteSelected.on('click', async event => {
            let soundscapes = game.settings.get(moduleName,'soundscapes');
            for (let i=this.soundscapes.length-1; i>=0; i--) 
                if (html.find(`input[id=select-${i}]`)[0].checked)
                    soundscapes.splice(i,1);
            await game.settings.set(moduleName,'soundscapes',soundscapes);
            this.render(true);
        })

        copySelected.on('click', async event => {
            let soundscapes = game.settings.get(moduleName,'soundscapes');
            const ssLength = soundscapes.length;
            for (let i=0; i<ssLength; i++) 
                if (html.find(`input[id=select-${i}]`)[0].checked)
                    soundscapes.push(soundscapes[i]);
            await game.settings.set(moduleName,'soundscapes',soundscapes);
            this.render(true);
        })

        exportSelected.on('click', event => {
            let soundscapes = game.settings.get(moduleName,'soundscapes');
            let exports = [];
            for (let i=0; i<soundscapes.length; i++) 
                if (html.find(`input[id=select-${i}]`)[0].checked)
                    exports.push(soundscapes[i]);
            if (exports.length == 0) {
                ui.notifications.warn(game.i18n.localize("SOUNDSCAPE.SelectSoundscapes"));
                return;
            }
            let exportDialog = new exportConfigForm();
            exportDialog.setData(exports);
            exportDialog.render(true);
        })

        importSelected.on('click', event => {
            let importDialog = new importConfigForm();
            importDialog.setData(this)
            importDialog.render(true);
        })
    }
}

