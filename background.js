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

const VERSION = browser.runtime.getManifest().version
const ALL_VERSIONS = ["1.0.0", VERSION]

const VALIDATORS = [
    validateFieldPresent("version"),
    validateFieldPresent("script"),
    validateFieldPresent("enabled"),
    validateFieldTypeAndValue("version", "string",
        val => ALL_VERSIONS.includes(val)),
    validateFieldTypeAndValue("script", "string"),
    validateFieldTypeAndValue("enabled", "boolean")
]

var registration = null;
var queue = null;

function send(id, initiator, data) {
    return browser.runtime.sendMessage({
        "id": id,
        "initiator": initiator,
        "data": data
    });
}

function notify(message) {
    switch (message.id) {
        case "get":
            queue.then(() => handleGet(message.initiator));
            break;
        case "set":
            queue.then(() => handleSet(message.initiator, message.data));
            break;
    }
}

async function handleGet(initiator) {
    try {
        await send("get-ok", initiator, await query());
    } catch (err) {
        await send("get-failed", initiator, err.message);
    }
}

async function handleSet(initiator, settings) {

    if (registration) {
        try {
            await registration.unregister();
        } catch (err) {
            console.log(`Error while unregistering script: ${err}`);
            await send("set-failed", initiator, "deactivate.script");
            return;
        }

        registration = null;
    }

    try {
        settings.version = VERSION
        await browser.storage.local.set(settings)
    } catch (err) {
        console.log(`Error while writing data to storage: ${err}`);
        await send("set-failed", initiator, "persist.settings");
        return;
    }

    try {
        await register(settings);
    } catch (err) {
        console.log(`Error while registering script: ${err}`);
        await send("set-failed", initiator, "activate.script");
        return;
    }

    await send("set-ok", initiator, settings);
}

function validateFieldPresent(field) {
    return [
        obj => field in obj,
        `The field "${field}" was not found in the settings. The data was ` +
        "probably tampered with. Please fix the problems before you can use " +
        "the plugin. An easy fix is to just delete everything and start anew."
    ]
}

function validateFieldTypeAndValue(field, type, validator = null) {
    validation_fn = function(obj) {
        var val = obj[field]
        return typeof val === type && (validator ? validator(val) : true)
    }

    return [
        validation_fn,
        `The field "${field}" has an invalid type or an an invalid value. ` +
        "The data was probably tampered with. Please fix the problems before " +
        "you can use the plugin. An easy fix is to just delete everything " +
        "and start anew."
    ]
}

function validateSettings(settings, ui_msg) {
    VALIDATORS.forEach(([validator, msg]) => {
        if (!validator(settings)) {
            console.log(msg);
            throw new Error("validate.settings");
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
    } catch (err) {
        console.log("Failed to retrieve data from persistent storage: " +
            `${err}`);
        throw new Error("query.settings");
    }

    validateSettings(settings);
    delete settings.version

    return settings;
}

async function register(settings) {
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
            throw err
        }
    }
}

browser.runtime.onMessage.addListener(notify);

queue = (async function() {
    try {
        await register(await query());
    } catch (err) {
        /* Ignore error. */
    }
})();
