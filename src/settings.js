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

};

