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

var apply_btn = document.getElementById("apply");
var status_lbl = document.getElementById("status");
var script_ed = document.getElementById("thescript");
var enabled_cb = document.getElementById("enabled");

function saveOptions(ev) {
    ev.preventDefault();

    apply_btn.disabled = true
    status_lbl.textContent = "Persisting values...";

    var vals = {
        script: script_ed.value,
        enabled: enabled_cb.checked
    };

    browser.storage.sync.set(vals)
        .then(() => {
            browser.runtime.sendMessage(vals)
            status_lbl.textContent = "";
        })
        .catch(reason => {
            console.log(`Error while writing data to storage: ${reason}`)
            apply_btn.disabled = false;
            status_lbl.textContent = "Failed to persist values.";
        });
}

function restoreOptions() {
    browser.storage.sync.get({
            script: "",
            enabled: false
        })
        .then(val => {
            script_ed.value = val.script
            enabled_cb.checked = val.enabled
        })
        .catch(reason => {
            console.log(`Error while retrieving data from storage: ${reason}`)
            status_lbl.textContent = "Failed to load persisted values.";
        });
}

function onChange() {
    apply_btn.disabled = false;
}

document.addEventListener("DOMContentLoaded", restoreOptions);
document.querySelector("form").addEventListener("submit", saveOptions);
script_ed.addEventListener("keydown", onChange);
enabled_cb.addEventListener("change", onChange);