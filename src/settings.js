import {moduleName} from "../soundscape.js";

export const registerSettings = function() {
    
    game.settings.register(moduleName, 'soundscapes', {
        name: "soundscapes",
        scope: "world",
        type: Array,
        default: [],
        config: false
    });

    game.settings.register(moduleName, 'fx', {
        name: "fx",
        scope: "world",
        type: Array,
        default: [],
        config: false
    });

    game.settings.register(moduleName,'volume', {
        name: "Volume",
        hint: "Volume",
        scope: "client",
        config: false,
        default: 0.5,
        type: Number
    });

    game.settings.register(moduleName,'sbEnabled', {
        name: "Soundboard Enabled",
        hint: "Soundboard Enabled",
        scope: "world",
        config: false,
        default: false,
        type: Boolean
    });

    /**
     * Sets the ip address of the server
     */
    /*
     game.settings.register(moduleName,'address', {
        name: "Server Address",
        hint: "Address of the server",
        scope: "client",
        config: true,
        default: "localhost:3001",
        type: String,
        onChange: x => window.location.reload()
    });
    */
   //Create the Help button
   game.settings.registerMenu('general', 'helpMenu',{
    name: "Soundscape.HelpName",
    label: "Soundscape.Help",
    type: helpMenu,
    restricted: false
});
};

class helpMenu extends FormApplication {
    constructor(data, options) {
        super(data, options);
    }
  
    /**
     * Default Options for this FormApplication
     */
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            id: "helpMenu",
            title: "Soundscape: Help",
            template: "./modules/Soundscape/templates/helpMenu.html",
            width: "500px"
        });
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
  
    }
  
    activateListeners(html) {
        super.activateListeners(html);
        
    }
  }