import {moduleName} from "../soundscape.js";
import {helpMenuSoundscapeConfig} from "./helpMenu.js";

export class soundscapeConfig extends FormApplication {
    constructor(data, options) {
        super(data, options);
        this.mixer;
        this.parent;
        this.soundscapes;
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
            title: "Soundscape: " + game.i18n.localize("Soundscape.SoundscapeConfig"),
            template: "./modules/Soundscape/templates/soundscapeConfig.html",
            width: "500px",
            height: "auto",
            maxHeight: "600px"
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
        
        return {
            soundscapes: this.soundscapes

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
            const id = parseInt(event.currentTarget.id.replace('load-',''));
            this.mixer.currentSoundscape = id;
            this.mixer.refresh();
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
            if (exports.length == 0) return;
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

class exportConfigForm extends FormApplication {
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
            template: "./modules/Soundscape/templates/exportDialog.html",
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
        this.download(this.data,formData.name)
    }

    activateListeners(html) {
        super.activateListeners(html);
    }

    download(data,name) {
        let dataStr = JSON.stringify(data);
        let dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        let exportFileDefaultName = `${name}.json`;
        let linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    }
}

class importConfigForm extends FormApplication {
    constructor(data, options) {
        super(data, options);
        this.data = {};
        this.name = "";
        this.source = "";
        this.parent;
    }

    /**
     * Default Options for this FormApplication
     */
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            id: "Soundscape_Import",
            title: "Soundscape: " + game.i18n.localize("Soundscape.Import"),
            template: "./modules/Soundscape/templates/importDialog.html",
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
        let soundscapes = game.settings.get(moduleName,'soundscapes');
        const newSoundscapes = soundscapes.concat(this.data);
        await game.settings.set(moduleName,'soundscapes',newSoundscapes)
        this.parent.render(true);
    }

    activateListeners(html) {
        super.activateListeners(html);

        const upload = html.find("input[id='uploadJson']");

        upload.on('change',(event) => {
            event.preventDefault();
            this.readJsonFile(event.target.files[0]); 
        })
    }

    readJsonFile(jsonFile) {
        var reader = new FileReader(); 
        reader.addEventListener('load', (loadEvent) => { 
          try { 
            let json = JSON.parse(loadEvent.target.result); 
            this.data = json;
          } catch (error) { 
            console.error(error); 
          } 
        }); 
        reader.readAsText(jsonFile); 
    } 


}