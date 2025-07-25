"use strict";
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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
var utils_1 = require("./utils");
var config_1 = require("./config");
var vue_1 = require("vue");
var Suggestions_vue_1 = require("./Suggestions.vue");
var Message_vue_1 = require("./Message.vue");
var ChatHideStates;
(function (ChatHideStates) {
    ChatHideStates[ChatHideStates["ShowWhenActive"] = 0] = "ShowWhenActive";
    ChatHideStates[ChatHideStates["AlwaysShow"] = 1] = "AlwaysShow";
    ChatHideStates[ChatHideStates["AlwaysHide"] = 2] = "AlwaysHide";
})(ChatHideStates || (ChatHideStates = {}));
var defaultMode = {
    name: 'all',
    displayName: 'All',
    color: '#fff'
};
var globalMode = {
    name: '_global',
    displayName: 'All',
    color: '#fff',
    isGlobal: true,
    hidden: true
};
exports.default = vue_1.default.extend({
    template: "#app_template",
    name: "app",
    components: {
        Suggestions: Suggestions_vue_1.default,
        MessageV: Message_vue_1.default
    },
    data: function () {
        return {
            style: config_1.default.style,
            showInput: false,
            showWindow: false,
            showHideState: false,
            hideState: ChatHideStates.ShowWhenActive,
            backingSuggestions: [],
            removedSuggestions: [],
            templates: __assign({}, config_1.default.templates),
            message: "",
            messages: [],
            oldMessages: [],
            oldMessagesIndex: -1,
            tplBackups: [],
            msgTplBackups: [],
            focusTimer: 0,
            showWindowTimer: 0,
            showHideStateTimer: 0,
            listener: function (event) { },
            modes: [defaultMode, globalMode],
            modeIdx: 0,
        };
    },
    destroyed: function () {
        clearInterval(this.focusTimer);
        window.removeEventListener("message", this.listener);
    },
    mounted: function () {
        var _this = this;
        (0, utils_1.post)("http://chat/loaded", JSON.stringify({}));
        this.listener = function (event) {
            var item = event.data || event.detail; //'detail' is for debugging via browsers
            if (!item || !item.type) {
                return;
            }
            var typeRef = item.type;
            if (_this[typeRef]) {
                _this[typeRef](item);
            }
        };
        window.addEventListener("message", this.listener);
    },
    watch: {
        messages: function () {
            if (this.hideState !== ChatHideStates.AlwaysHide) {
                if (this.showWindowTimer) {
                    clearTimeout(this.showWindowTimer);
                }
                this.showWindow = true;
                this.resetShowWindowTimer();
            }
            var messagesObj = this.$refs.messages;
            this.$nextTick(function () {
                messagesObj.scrollTop = messagesObj.scrollHeight;
            });
        }
    },
    computed: {
        filteredMessages: function () {
            var _this = this;
            return this.messages.filter(
            // show messages that are
            // - (if the current mode is a channel) global, or in the current mode
            // - (if the message is a channel) in the current mode
            function (el) {
                var _a, _b;
                return (((_a = el.modeData) === null || _a === void 0 ? void 0 : _a.isChannel) || _this.modes[_this.modeIdx].isChannel) ?
                    (el.mode === _this.modes[_this.modeIdx].name || ((_b = el.modeData) === null || _b === void 0 ? void 0 : _b.isGlobal)) :
                    true;
            });
        },
        suggestions: function () {
            var _this = this;
            return this.backingSuggestions.filter(function (el) { return _this.removedSuggestions.indexOf(el.name) <= -1; });
        },
        hideAnimated: function () {
            return this.hideState !== ChatHideStates.AlwaysHide;
        },
        modeIdxGet: function () {
            return (this.modeIdx >= this.modes.length) ? (this.modes.length - 1) : this.modeIdx;
        },
        modePrefix: function () {
            if (this.modes.length === 2) {
                return "\u27A4";
            }
            return this.modes[this.modeIdxGet].displayName;
        },
        modeColor: function () {
            return this.modes[this.modeIdxGet].color;
        },
        hideStateString: function () {
            // TODO: localization
            switch (this.hideState) {
                case ChatHideStates.AlwaysShow:
                    return 'Visible';
                case ChatHideStates.AlwaysHide:
                    return 'Hidden';
                case ChatHideStates.ShowWhenActive:
                    return 'When active';
            }
        }
    },
    methods: {
        ON_SCREEN_STATE_CHANGE: function (_a) {
            var _this = this;
            var hideState = _a.hideState, fromUserInteraction = _a.fromUserInteraction;
            this.hideState = hideState;
            if (this.hideState === ChatHideStates.AlwaysHide) {
                if (!this.showInput) {
                    this.showWindow = false;
                }
            }
            else if (this.hideState === ChatHideStates.AlwaysShow) {
                this.showWindow = true;
                if (this.showWindowTimer) {
                    clearTimeout(this.showWindowTimer);
                }
            }
            else {
                this.resetShowWindowTimer();
            }
            if (fromUserInteraction) {
                this.showHideState = true;
                if (this.showHideStateTimer) {
                    clearTimeout(this.showHideStateTimer);
                }
                this.showHideStateTimer = window.setTimeout(function () {
                    _this.showHideState = false;
                }, 1500);
            }
        },
        ON_OPEN: function () {
            var _this = this;
            this.showInput = true;
            this.showWindow = true;
            if (this.showWindowTimer) {
                clearTimeout(this.showWindowTimer);
            }
            this.focusTimer = window.setInterval(function () {
                if (_this.$refs.input) {
                    _this.$refs.input.focus();
                }
                else {
                    clearInterval(_this.focusTimer);
                }
            }, 100);
        },
        ON_MESSAGE: function (_a) {
            var message = _a.message;
            message.id = "".concat(new Date().getTime()).concat(Math.random());
            message.modeData = this.modes.find(function (mode) { return mode.name === message.mode; });
            this.messages.push(message);
        },
        ON_CLEAR: function () {
            this.messages = [];
            this.oldMessages = [];
            this.oldMessagesIndex = -1;
        },
        ON_SUGGESTION_ADD: function (_a) {
            var suggestion = _a.suggestion;
            this.removedSuggestions = this.removedSuggestions.filter(function (a) { return a !== suggestion.name; });
            var duplicateSuggestion = this.backingSuggestions.find(function (a) { return a.name == suggestion.name; });
            if (duplicateSuggestion) {
                if (suggestion.help || suggestion.params) {
                    duplicateSuggestion.help = suggestion.help || "";
                    duplicateSuggestion.params = suggestion.params || [];
                }
                return;
            }
            if (!suggestion.params) {
                suggestion.params = []; //TODO Move somewhere else
            }
            this.backingSuggestions.push(suggestion);
        },
        ON_SUGGESTION_REMOVE: function (_a) {
            var name = _a.name;
            if (this.removedSuggestions.indexOf(name) <= -1) {
                this.removedSuggestions.push(name);
            }
        },
        ON_MODE_ADD: function (_a) {
            var mode = _a.mode;
            this.modes = __spreadArray(__spreadArray([], this.modes.filter(function (a) { return a.name !== mode.name; }), true), [
                mode
            ], false);
        },
        ON_MODE_REMOVE: function (_a) {
            var name = _a.name;
            this.modes = this.modes.filter(function (a) { return a.name !== name; });
            if (this.modes.length === 0) {
                this.modes = [defaultMode];
            }
        },
        ON_TEMPLATE_ADD: function (_a) {
            var template = _a.template;
            if (this.templates[template.id]) {
                this.warn("Tried to add duplicate template '".concat(template.id, "'"));
            }
            else {
                this.templates[template.id] = template.html;
            }
        },
        ON_UPDATE_THEMES: function (_a) {
            var themes = _a.themes;
            this.removeThemes();
            this.setThemes(themes);
        },
        removeThemes: function () {
            var _a;
            for (var i = 0; i < document.styleSheets.length; i++) {
                var styleSheet = document.styleSheets[i];
                var node = styleSheet.ownerNode;
                if (node.getAttribute("data-theme")) {
                    (_a = node.parentNode) === null || _a === void 0 ? void 0 : _a.removeChild(node);
                }
            }
            this.tplBackups.reverse();
            for (var _i = 0, _b = this.tplBackups; _i < _b.length; _i++) {
                var _c = _b[_i], elem = _c[0], oldData = _c[1];
                elem.innerText = oldData;
            }
            this.tplBackups = [];
            this.msgTplBackups.reverse();
            for (var _d = 0, _e = this.msgTplBackups; _d < _e.length; _d++) {
                var _f = _e[_d], id = _f[0], oldData = _f[1];
                this.templates[id] = oldData;
            }
            this.msgTplBackups = [];
        },
        setThemes: function (themes) {
            for (var _i = 0, _a = Object.entries(themes); _i < _a.length; _i++) {
                var _b = _a[_i], id = _b[0], data = _b[1];
                if (data.style) {
                    var style = document.createElement("style");
                    style.type = "text/css";
                    style.setAttribute("data-theme", id);
                    style.appendChild(document.createTextNode(data.style));
                    document.head.appendChild(style);
                }
                if (data.styleSheet) {
                    var link = document.createElement("link");
                    link.rel = "stylesheet";
                    link.type = "text/css";
                    link.href = data.baseUrl + data.styleSheet;
                    link.setAttribute("data-theme", id);
                    document.head.appendChild(link);
                }
                if (data.templates) {
                    for (var _c = 0, _d = Object.entries(data.templates); _c < _d.length; _c++) {
                        var _e = _d[_c], tplId = _e[0], tpl = _e[1];
                        var elem = document.getElementById(tplId);
                        if (elem) {
                            this.tplBackups.push([elem, elem.innerText]);
                            elem.innerText = tpl;
                        }
                    }
                }
                if (data.script) {
                    var script = document.createElement("script");
                    script.type = "text/javascript";
                    script.src = data.baseUrl + data.script;
                    document.head.appendChild(script);
                }
                if (data.msgTemplates) {
                    for (var _f = 0, _g = Object.entries(data.msgTemplates); _f < _g.length; _f++) {
                        var _h = _g[_f], tplId = _h[0], tpl = _h[1];
                        this.msgTplBackups.push([tplId, this.templates[tplId]]);
                        this.templates[tplId] = tpl;
                    }
                }
            }
        },
        warn: function (msg) {
            this.messages.push({
                args: [msg],
                template: "^3<b>CHAT-WARN</b>: ^0{0}"
            });
        },
        clearShowWindowTimer: function () {
            clearTimeout(this.showWindowTimer);
        },
        resetShowWindowTimer: function () {
            var _this = this;
            this.clearShowWindowTimer();
            this.showWindowTimer = window.setTimeout(function () {
                if (_this.hideState !== ChatHideStates.AlwaysShow && !_this.showInput) {
                    _this.showWindow = false;
                }
            }, config_1.default.fadeTimeout);
        },
        keyUp: function () {
            this.resize();
        },
        keyDown: function (e) {
            if (e.which === 38 || e.which === 40) {
                e.preventDefault();
                this.moveOldMessageIndex(e.which === 38);
            }
            else if (e.which == 33) {
                var buf = document.getElementsByClassName("chat-messages")[0];
                buf.scrollTop = buf.scrollTop - 100;
            }
            else if (e.which == 34) {
                var buf = document.getElementsByClassName("chat-messages")[0];
                buf.scrollTop = buf.scrollTop + 100;
            }
            else if (e.which === 9) { // tab
                if (e.shiftKey || e.altKey) {
                    do {
                        --this.modeIdx;
                        if (this.modeIdx < 0) {
                            this.modeIdx = this.modes.length - 1;
                        }
                    } while (this.modes[this.modeIdx].hidden);
                }
                else {
                    do {
                        this.modeIdx = (this.modeIdx + 1) % this.modes.length;
                    } while (this.modes[this.modeIdx].hidden);
                }
                var buf_1 = document.getElementsByClassName('chat-messages')[0];
                setTimeout(function () { return buf_1.scrollTop = buf_1.scrollHeight; }, 0);
            }
            this.resize();
        },
        moveOldMessageIndex: function (up) {
            if (up && this.oldMessages.length > this.oldMessagesIndex + 1) {
                this.oldMessagesIndex += 1;
                this.message = this.oldMessages[this.oldMessagesIndex];
            }
            else if (!up && this.oldMessagesIndex - 1 >= 0) {
                this.oldMessagesIndex -= 1;
                this.message = this.oldMessages[this.oldMessagesIndex];
            }
            else if (!up && this.oldMessagesIndex - 1 === -1) {
                this.oldMessagesIndex = -1;
                this.message = "";
            }
        },
        resize: function () {
            var input = this.$refs.input;
            // scrollHeight includes padding, but content-box excludes padding
            // remove padding before setting height on the element
            var style = getComputedStyle(input);
            var paddingRemove = parseFloat(style.paddingBottom) + parseFloat(style.paddingTop);
            input.style.height = "5px";
            input.style.height = "".concat(input.scrollHeight - paddingRemove, "px");
        },
        send: function () {
            if (this.message !== "") {
                (0, utils_1.post)("http://chat/chatResult", JSON.stringify({
                    message: this.message,
                    mode: this.modes[this.modeIdxGet].name
                }));
                this.oldMessages.unshift(this.message);
                this.oldMessagesIndex = -1;
                this.hideInput();
            }
            else {
                this.hideInput(true);
            }
        },
        hideInput: function (canceled) {
            var _this = this;
            if (canceled === void 0) { canceled = false; }
            setTimeout(function () {
                var input = _this.$refs.input;
                input.style.height = '';
            }, 50);
            if (canceled) {
                (0, utils_1.post)("http://chat/chatResult", JSON.stringify({ canceled: canceled }));
            }
            this.message = "";
            this.showInput = false;
            clearInterval(this.focusTimer);
            if (this.hideState !== ChatHideStates.AlwaysHide) {
                this.resetShowWindowTimer();
            }
            else {
                this.showWindow = false;
            }
        }
    }
});
