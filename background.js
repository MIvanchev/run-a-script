/*
This file is part of run-a-script
Copyright (C) 2022-present Mihail Ivanchev

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program. If not, see <http://www.gnu.org/licenses/>.
*/

const VER_MAJOR = 1
const VER_MINOR = 0
const VER_PATCH = 1
const VER_STR = `${VER_MAJOR}.${VER_MINOR}.${VER_PATCH}`
const KNOWN_VERS = ["1.0.0", VER_STR]

const VALIDATORS = [
    validateFieldPresent("version"),
    validateFieldPresent("script"),
    validateFieldPresent("enabled"),
    validateFieldTypeAndValue("version", val => typeof val === "string" &&
        KNOWN_VERS.includes(val)),
    validateFieldTypeAndValue("script", val => typeof val === "string"),
    validateFieldTypeAndValue("enabled", val => typeof val === "boolean")
]

var registration = null;

function send(id, data) {
    browser.runtime.sendMessage({
        "id": id,
        "data": data
    });
}

function notify(message) {
    switch (message.id) {
        case "get":
            handleGet();
            break;
        case "set":
            handleSet(message.data);
            break;
    }
}

async function handleGet() {
    try {
        settings = await query();
        send("get-ok", settings);
    } catch (err) {
        send("get-failed", err.message);
    }
}

async function handleSet(settings) {

    reg = await Promise.resolve(registration);

    if (reg) {
        try {
            await reg.unregister();
        } catch (err) {
            console.log(`Error while unregistering script: ${err}`);
            send("set-failed", "Failed to deactivate current script, " +
                "settings not persisted.");
            return;
        }

        registration = null;
    }

    try {
        settings.version = VER_STR
        await browser.storage.local.set(settings)
    } catch (err) {
        console.log(`Error while writing data to storage: ${err}`);
        send("set-failed", "Failed to persist settings, " +
            "no script currently active.");
        return;
    }

    if (settings.enabled) {
        var options = {
            "js": [{
                "file": "jquery-3.6.0.min.js"
            }, {
                "code": settings.script
            }],
            "matches": ["http://*/*", "https://*/*"],
            "runAt": "document_start"
        };

        try {
            registration = await browser.userScripts.register(options);
        } catch (err) {
            console.log(`Error while registering script: ${err}`)
            send("set-failed", "Failed to activate new script " +
                "but settings persisted.");
            return;
        }
    }

    send("set-ok", settings);
}

function validateFieldPresent(field) {
    return [
        obj => field in obj,
        `The field "${field}" was not found in the settings. The data was ` +
        "probably tampered with. Please fix the problems before you can use " +
        "the plugin. An easy fix is to just delete everything and start anew."
    ]
}

function validateFieldTypeAndValue(field, validator) {
    return [
        obj => validator(obj[field]),
        `The field "${field}" has an  invalid type or an an invalid value. ` +
        "The data was probably tampered with. Please fix the problems before " +
        "you can use the plugin. An easy fix is to just delete everything " +
        "and start anew."
    ]
}

function validateSettings(settings, ui_msg) {
    VALIDATORS.forEach(([validator, msg]) => {
        if (!validator(settings)) {
            console.log(msg);
            throw new Error(ui_msg);
        }
    });
}

async function query() {
    var settings;

    try {
        settings = await browser.storage.local.get()
        if (Object.keys(settings).length === 0) {
            // Compatiblity with 1.0.0, the settings might be in sync storage.
            settings = await browser.storage.sync.get()
            if (Object.keys(settings).length === 0) {
                settings = {
                    "version": "1.0.0",
                    "script": "",
                    "enabled": false
                }
            } else if (!("version" in settings)) {
                settings.version = "1.0.0";
            }
        }
    } catch (error) {
        console.log("Failed to retrieve data from persistent storage: " +
            `${error}`);
        throw new Error("Failed to retrieve persisted data.");
    }

    validateSettings(settings, "Failed to validate persistent settings, " +
        "see the addon inspector.");
    delete settings.version

    return settings;
}

async function register(script) {
    var options = {
        "js": [{
            "file": "jquery-3.6.0.min.js"
        }, {
            "code": script
        }],
        "matches": ["http://*/*", "https://*/*"],
        "runAt": "document_start"
    };

    try {
        return await browser.userScripts.register(options);
    } catch (err) {
        console.log(`Error while registering script: ${err}`)
        throw new Error("Failed to register script.");
    }
}


browser.runtime.onMessage.addListener(notify);

registration = (async function() {
    var res = null;

    try {
        settings = await query();
        if (settings.enabled) {
            res = await register(settings.script);
        }
    } catch (err) {
        /* Ignore GUI error */
    }

    return res;
})();
