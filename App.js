import { post } from './utils';
import CONFIG from './config';
import Vue from 'vue';
import Suggestions from './Suggestions.vue';
import MessageV from './Message.vue';
var ChatHideStates;
(function (ChatHideStates) {
    ChatHideStates[ChatHideStates["ShowWhenActive"] = 0] = "ShowWhenActive";
    ChatHideStates[ChatHideStates["AlwaysShow"] = 1] = "AlwaysShow";
    ChatHideStates[ChatHideStates["AlwaysHide"] = 2] = "AlwaysHide";
})(ChatHideStates || (ChatHideStates = {}));
const defaultMode = {
    name: 'all',
    displayName: 'All',
    color: '#fff'
};
const globalMode = {
    name: '_global',
    displayName: 'All',
    color: '#fff',
    isGlobal: true,
    hidden: true
};
export default Vue.extend({
    template: "#app_template",
    name: "app",
    components: {
        Suggestions,
        MessageV
    },
    data() {
        return {
            style: CONFIG.style,
            showInput: false,
            showWindow: false,
            showHideState: false,
            hideState: ChatHideStates.ShowWhenActive,
            backingSuggestions: [],
            removedSuggestions: [],
            templates: Object.assign({}, CONFIG.templates),
            message: "",
            messages: [],
            oldMessages: [],
            oldMessagesIndex: -1,
            tplBackups: [],
            msgTplBackups: [],
            focusTimer: 0,
            showWindowTimer: 0,
            showHideStateTimer: 0,
            listener: (event) => { },
            modes: [defaultMode, globalMode],
            modeIdx: 0,
        };
    },
    destroyed() {
        clearInterval(this.focusTimer);
        window.removeEventListener("message", this.listener);
    },
    mounted() {
        post("http://chat/loaded", JSON.stringify({}));
        this.listener = (event) => {
            const item = event.data || event.detail; //'detail' is for debugging via browsers
            if (!item || !item.type) {
                return;
            }
            const typeRef = item.type;
            if (this[typeRef]) {
                this[typeRef](item);
            }
        };
        window.addEventListener("message", this.listener);
    },
    watch: {
        messages() {
            if (this.hideState !== ChatHideStates.AlwaysHide) {
                if (this.showWindowTimer) {
                    clearTimeout(this.showWindowTimer);
                }
                this.showWindow = true;
                this.resetShowWindowTimer();
            }
            const messagesObj = this.$refs.messages;
            this.$nextTick(() => {
                messagesObj.scrollTop = messagesObj.scrollHeight;
            });
        }
    },
    computed: {
        filteredMessages() {
            return this.messages.filter(
            // show messages that are
            // - (if the current mode is a channel) global, or in the current mode
            // - (if the message is a channel) in the current mode
            el => {
                var _a, _b;
                return (((_a = el.modeData) === null || _a === void 0 ? void 0 : _a.isChannel) || this.modes[this.modeIdx].isChannel) ?
                    (el.mode === this.modes[this.modeIdx].name || ((_b = el.modeData) === null || _b === void 0 ? void 0 : _b.isGlobal)) :
                    true;
            });
        },
        suggestions() {
            return this.backingSuggestions.filter(el => this.removedSuggestions.indexOf(el.name) <= -1);
        },
        hideAnimated() {
            return this.hideState !== ChatHideStates.AlwaysHide;
        },
        modeIdxGet() {
            return (this.modeIdx >= this.modes.length) ? (this.modes.length - 1) : this.modeIdx;
        },
        modePrefix() {
            if (this.modes.length === 2) {
                return `➤`;
            }
            return this.modes[this.modeIdxGet].displayName;
        },
        modeColor() {
            return this.modes[this.modeIdxGet].color;
        },
        hideStateString() {
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
        ON_SCREEN_STATE_CHANGE({ hideState, fromUserInteraction }) {
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
                this.showHideStateTimer = window.setTimeout(() => {
                    this.showHideState = false;
                }, 1500);
            }
        },
        ON_OPEN() {
            this.showInput = true;
            this.showWindow = true;
            if (this.showWindowTimer) {
                clearTimeout(this.showWindowTimer);
            }
            this.focusTimer = window.setInterval(() => {
                if (this.$refs.input) {
                    this.$refs.input.focus();
                }
                else {
                    clearInterval(this.focusTimer);
                }
            }, 100);
        },
        ON_MESSAGE({ message }) {
            message.id = `${new Date().getTime()}${Math.random()}`;
            message.modeData = this.modes.find(mode => mode.name === message.mode);
            this.messages.push(message);
        },
        ON_CLEAR() {
            this.messages = [];
            this.oldMessages = [];
            this.oldMessagesIndex = -1;
        },
        ON_SUGGESTION_ADD({ suggestion }) {
            this.removedSuggestions = this.removedSuggestions.filter(a => a !== suggestion.name);
            const duplicateSuggestion = this.backingSuggestions.find(a => a.name == suggestion.name);
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
        ON_SUGGESTION_REMOVE({ name }) {
            if (this.removedSuggestions.indexOf(name) <= -1) {
                this.removedSuggestions.push(name);
            }
        },
        ON_MODE_ADD({ mode }) {
            this.modes = [
                ...this.modes.filter(a => a.name !== mode.name),
                mode
            ];
        },
        ON_MODE_REMOVE({ name }) {
            this.modes = this.modes.filter(a => a.name !== name);
            if (this.modes.length === 0) {
                this.modes = [defaultMode];
            }
        },
        ON_TEMPLATE_ADD({ template }) {
            if (this.templates[template.id]) {
                this.warn(`Tried to add duplicate template '${template.id}'`);
            }
            else {
                this.templates[template.id] = template.html;
            }
        },
        ON_UPDATE_THEMES({ themes }) {
            this.removeThemes();
            this.setThemes(themes);
        },
        removeThemes() {
            var _a;
            for (let i = 0; i < document.styleSheets.length; i++) {
                const styleSheet = document.styleSheets[i];
                const node = styleSheet.ownerNode;
                if (node.getAttribute("data-theme")) {
                    (_a = node.parentNode) === null || _a === void 0 ? void 0 : _a.removeChild(node);
                }
            }
            this.tplBackups.reverse();
            for (const [elem, oldData] of this.tplBackups) {
                elem.innerText = oldData;
            }
            this.tplBackups = [];
            this.msgTplBackups.reverse();
            for (const [id, oldData] of this.msgTplBackups) {
                this.templates[id] = oldData;
            }
            this.msgTplBackups = [];
        },
        setThemes(themes) {
            for (const [id, data] of Object.entries(themes)) {
                if (data.style) {
                    const style = document.createElement("style");
                    style.type = "text/css";
                    style.setAttribute("data-theme", id);
                    style.appendChild(document.createTextNode(data.style));
                    document.head.appendChild(style);
                }
                if (data.styleSheet) {
                    const link = document.createElement("link");
                    link.rel = "stylesheet";
                    link.type = "text/css";
                    link.href = data.baseUrl + data.styleSheet;
                    link.setAttribute("data-theme", id);
                    document.head.appendChild(link);
                }
                if (data.templates) {
                    for (const [tplId, tpl] of Object.entries(data.templates)) {
                        const elem = document.getElementById(tplId);
                        if (elem) {
                            this.tplBackups.push([elem, elem.innerText]);
                            elem.innerText = tpl;
                        }
                    }
                }
                if (data.script) {
                    const script = document.createElement("script");
                    script.type = "text/javascript";
                    script.src = data.baseUrl + data.script;
                    document.head.appendChild(script);
                }
                if (data.msgTemplates) {
                    for (const [tplId, tpl] of Object.entries(data.msgTemplates)) {
                        this.msgTplBackups.push([tplId, this.templates[tplId]]);
                        this.templates[tplId] = tpl;
                    }
                }
            }
        },
        warn(msg) {
            this.messages.push({
                args: [msg],
                template: "^3<b>CHAT-WARN</b>: ^0{0}"
            });
        },
        clearShowWindowTimer() {
            clearTimeout(this.showWindowTimer);
        },
        resetShowWindowTimer() {
            this.clearShowWindowTimer();
            this.showWindowTimer = window.setTimeout(() => {
                if (this.hideState !== ChatHideStates.AlwaysShow && !this.showInput) {
                    this.showWindow = false;
                }
            }, CONFIG.fadeTimeout);
        },
        keyUp() {
            this.resize();
        },
        keyDown(e) {
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
                const buf = document.getElementsByClassName('chat-messages')[0];
                setTimeout(() => buf.scrollTop = buf.scrollHeight, 0);
            }
            this.resize();
        },
        moveOldMessageIndex(up) {
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
        resize() {
            const input = this.$refs.input;
            // scrollHeight includes padding, but content-box excludes padding
            // remove padding before setting height on the element
            const style = getComputedStyle(input);
            const paddingRemove = parseFloat(style.paddingBottom) + parseFloat(style.paddingTop);
            input.style.height = "5px";
            input.style.height = `${input.scrollHeight - paddingRemove}px`;
        },
        send() {
            if (this.message !== "") {
                post("http://chat/chatResult", JSON.stringify({
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
        hideInput(canceled = false) {
            setTimeout(() => {
                const input = this.$refs.input;
                input.style.height = '';
            }, 50);
            if (canceled) {
                post("http://chat/chatResult", JSON.stringify({ canceled }));
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
