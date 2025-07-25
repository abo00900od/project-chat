export function post(url, data) {
    var request = new XMLHttpRequest();
    request.open('POST', url, true);
    request.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
    request.send(data);
}
function emulate(type, detail = {}) {
    const detailRef = Object.assign({ type }, detail);
    window.dispatchEvent(new CustomEvent('message', {
        detail: detailRef
    }));
}
window['emulate'] = emulate;
window['demo'] = () => {
    emulate('ON_MESSAGE', {
        message: {
            args: ['me', 'hello!']
        }
    });
    emulate('ON_SCREEN_STATE_CHANGE', {
        shouldHide: false
    });
};
