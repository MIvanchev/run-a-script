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

function saveOptions(ev) {
    ev.preventDefault();
    var vals = {
        script: document.querySelector("#thescript").value,
        enabled: document.querySelector("#enabled").checked
    };
    browser.storage.sync.set(vals)
        .then(() => {
            browser.runtime.sendMessage(vals)
        })
        .catch(reason => {
            console.log(`Error while writing data to storage: ${reason}`)
        });
}

function restoreOptions() {
    browser.storage.sync.get({
            script: "",
            enabled: false
        })
        .then(val => {
            document.querySelector("#thescript").value = val.script
            document.querySelector("#enabled").checked = val.enabled
        })
        .catch(reason => {
            console.log(`Error while retrieving data from storage: ${reason}`)
        });
}

document.addEventListener("DOMContentLoaded", restoreOptions);
document.querySelector("form").addEventListener("submit", saveOptions);