export class helpMenuMixer extends FormApplication {
    constructor(data, options) {
        super(data, options);
    }

    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            id: "helpMenu_mixer",
            title: game.i18n.localize("Soundscape.HelpMenu.Mixer"),
            template: "./modules/soundscape/src/Help/helpMenu_mixer.html",
            width: "500px"
        });
    }
}

export class helpMenuFx extends FormApplication {
    constructor(data, options) {
        super(data, options);
    }

    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            id: "helpMenu_fxConfig",
            title: game.i18n.localize("Soundscape.HelpMenu.FxConfig"),
            template: "./modules/soundscape/src/Help/helpMenu_fx.html",
            width: "500px"
        });
    }
}

export class helpMenuSoundConfig extends FormApplication {
    constructor(data, options) {
        super(data, options);
    }

    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            id: "helpMenu_soundConfig",
            title: game.i18n.localize("Soundscape.HelpMenu.SoundConfig"),
            template: "./modules/soundscape/src/Help/helpMenu_soundConfig.html",
            width: "500px"
        });
    }
}

export class helpMenuSoundboardConfig extends FormApplication {
    constructor(data, options) {
        super(data, options);
    }

    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            id: "helpMenu_soundboard",
            title: game.i18n.localize("Soundscape.HelpMenu.Soundboard"),
            template: "./modules/soundscape/src/Help/helpMenu_soundboardConfig.html",
            width: "500px"
        });
    }
}

export class helpMenuSoundscapeConfig extends FormApplication {
    constructor(data, options) {
        super(data, options);
    }

    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            id: "helpMenu_soundscape",
            title: game.i18n.localize("Soundscape.HelpMenu.Soundscape"),
            template: "./modules/soundscape/src/Help/helpMenu_soundscapeConfig.html",
            width: "500px"
        });
    }
}

export class helpMenuImport extends FormApplication {
    constructor(data, options) {
        super(data, options);
    }

    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            id: "helpMenu_import",
            title: game.i18n.localize("Soundscape.HelpMenu.Import"),
            template: "./modules/soundscape/src/Help/helpMenu_import.html",
            width: "500px"
        });
    }
}

export class helpMenuExport extends FormApplication {
    constructor(data, options) {
        super(data, options);
    }

    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            id: "helpMenu_export",
            title: game.i18n.localize("Soundscape.HelpMenu.Export"),
            template: "./modules/soundscape/src/Help/helpMenu_export.html",
            width: "500px"
        });
    }
}