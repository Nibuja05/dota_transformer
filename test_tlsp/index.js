"use strict";
console.log("IN HERE");
function init(modules) {
    const ts = modules.typescript;
    function create(info) {
        // Set up decorator object
        const proxy = Object.create(null);
        console.log("IN HERE 2");
        for (let k of Object.keys(info.languageService)) {
            const x = info.languageService[k];
            // @ts-expect-error - JS runtime trickery which is tricky to type tersely
            proxy[k] = (...args) => x.apply(info.languageService, args);
            console.log("IN HERE 3");
        }
        return proxy;
    }
    return { create };
}
module.exports = init;
