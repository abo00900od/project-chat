var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
function post(url, data) {
    var request = new XMLHttpRequest();
    request.open('POST', url, true);
    request.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
    request.send(data);
}
function emulate(type, detail) {
    if (detail === void 0) { detail = {}; }
    var detailRef = __assign({ type: type }, detail);
    window.dispatchEvent(new CustomEvent('message', {
        detail: detailRef
    }));
}
window['post'] = post;
window['emulate'] = emulate;
window['demo'] = function () {
    emulate('ON_MESSAGE', {
        message: {
            args: ['me', 'hello!']
        }
    });
    emulate('ON_SCREEN_STATE_CHANGE', {
        shouldHide: false
    });
};
