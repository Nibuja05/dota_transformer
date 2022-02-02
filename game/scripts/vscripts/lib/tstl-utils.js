const global = globalThis;
if (global.reloadCache === undefined) {
    global.reloadCache = {};
}
export function reloadable(constructor) {
    const className = constructor.name;
    if (global.reloadCache[className] === undefined) {
        global.reloadCache[className] = constructor;
    }
    Object.assign(global.reloadCache[className].prototype, constructor.prototype);
    return global.reloadCache[className];
}
