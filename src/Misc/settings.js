import {moduleName} from "../../soundscape.js";

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

    game.settings.register(moduleName,'firstBoot', {
        name: "firstBoot",
        hint: "firstBoot",
        scope: "world",
        config: false,
        default: true,
        type: Boolean
    });
};

