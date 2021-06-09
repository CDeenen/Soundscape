export class helpMenuMixer extends FormApplication {
    constructor(data, options) {
        super(data, options);
    }

    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            id: "helpMenu",
            title: "Soundscape: Mixer & Soundboard Help",
            template: "./modules/Soundscape/templates/help/helpMenu_mixer.html",
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
            id: "helpMenu",
            title: "Soundscape: Fx Config Help",
            template: "./modules/Soundscape/templates/help/helpMenu_fx.html",
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
            id: "helpMenu",
            title: "Soundscape: Sound Configuration Help",
            template: "./modules/Soundscape/templates/help/helpMenu_soundConfig.html",
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
            id: "helpMenu",
            title: "Soundscape: Soundboard Configuration Help",
            template: "./modules/Soundscape/templates/help/helpMenu_soundboardConfig.html",
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
            id: "helpMenu",
            title: "Soundscape: Soundscape Configuration Help",
            template: "./modules/Soundscape/templates/help/helpMenu_soundscapeConfig.html",
            width: "500px"
        });
    }
}