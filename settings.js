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

const MESSAGES = {
    "deactivate.script": "Failed to deactivate current script, settings not " +
        "persisted.",
    "persist.settings": "Failed to persist settings, no script currently " +
        "active.",
    "activate.script": "Failed to activate new script but settings persisted.",
    "query.settings": "Failed to retrieve persisted data, see the addon " +
        "inspector.",
    "validate.settings": "Failed to validate persistent settings, " +
        "see the addon inspector."
};

var uuid = crypto.randomUUID();

var form = document.querySelector("form")
var apply_btn = document.getElementById("apply");
var status_lbl = document.getElementById("status");
var script_ed = document.getElementById("thescript");
var enabled_cb = document.getElementById("enabled");
var version_lbl = document.getElementById("version");

function send(id, data = null) {
    browser.runtime.sendMessage({
        "id": id,
        "initiator": uuid,
        "data": data
    });
}

function notify(message) {
    var {
        id,
        initiator,
        data
    } = message;

    if (initiator != uuid) {
        return;
    }

    switch (id) {
        case "get-ok":
            script_ed.value = data.script
            enabled_cb.checked = data.enabled
            setComponentsStatus(false, "");
            form.removeEventListener("submit", restoreOptions);
            form.addEventListener("submit", saveOptions);
            break;
        case "get-failed":
            status_lbl.textContent = MESSAGES[data];
            apply_btn.textContent = "Retry";
            apply_btn.disabled = false;
            break;
        case "set-ok":
            script_ed.value = data.script;
            enabled_cb.checked = data.enabled;
            setComponentsStatus(false, "Settings applied successfully.");
            break;
        case "set-failed":
            setComponentsStatus(false, MESSAGES[data]);
            break;
    }
}

function setComponentsStatus(disabled, msg) {
    script_ed.disabled = disabled;
    enabled_cb.disabled = disabled;
    apply_btn.disabled = disabled;
    status_lbl.textContent = msg;
}

function saveOptions(ev) {
    ev.preventDefault();

    setComponentsStatus(true, "Applying settings...");

    var settings = {
        "script": script_ed.value,
        "enabled": enabled_cb.checked
    };

    send("set", settings);
}

async function restoreOptions() {
    status_lbl.textContent = "Loading perstited settings..."
    send("get");
}

browser.runtime.onMessage.addListener(notify);
document.addEventListener("DOMContentLoaded", restoreOptions);
form.addEventListener("submit", restoreOptions);
version_lbl.textContent = browser.runtime.getManifest().version;
