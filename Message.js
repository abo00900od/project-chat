"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var config_1 = require("./config");
var vue_1 = require("vue");
exports.default = vue_1.default.component('message', {
    data: function () {
        return {};
    },
    computed: {
        textEscaped: function () {
            var _this = this;
            var s = this.template ? this.template : this.templates[this.templateId];
            //This hack is required to preserve backwards compatability
            if (!this.template && this.templateId == config_1.default.defaultTemplateId
                && this.args.length == 1) {
                s = this.templates[config_1.default.defaultAltTemplateId]; //Swap out default template :/
            }
            s = s.replace("@default", this.templates[this.templateId]);
            s = s.replace(/{(\d+)}/g, function (match, number) {
                var argEscaped = _this.args[number] != undefined ? _this.escape(_this.args[number]) : match;
                if (number == 0 && _this.color) {
                    //color is deprecated, use templates or ^1 etc.
                    return _this.colorizeOld(argEscaped);
                }
                return argEscaped;
            });
            // format variant args
            s = s.replace(/\{\{([a-zA-Z0-9_\-]+?)\}\}/g, function (match, id) {
                var argEscaped = _this.params[id] != undefined ? _this.escape(_this.params[id]) : match;
                return argEscaped;
            });
            return this.colorize(s);
        },
    },
    methods: {
        colorizeOld: function (str) {
            return "<span style=\"color: rgb(".concat(this.color[0], ", ").concat(this.color[1], ", ").concat(this.color[2], ")\">").concat(str, "</span>");
        },
        colorize: function (str) {
            var s = "<span>" + colorTrans(str) + "</span>";
            var styleDict = {
                '*': 'font-weight: bold;',
                '_': 'text-decoration: underline;',
                '~': 'text-decoration: line-through;',
                '=': 'text-decoration: underline line-through;',
                'r': 'text-decoration: none;font-weight: normal;',
            };
            var styleRegex = /\^(\_|\*|\=|\~|\/|r)(.*?)(?=$|\^r|<\/em>)/;
            while (s.match(styleRegex)) { //Any better solution would be appreciated :P
                s = s.replace(styleRegex, function (str, style, inner) { return "<em style=\"".concat(styleDict[style], "\">").concat(inner, "</em>"); });
            }
            return s.replace(/<span[^>]*><\/span[^>]*>/g, '');
            function colorTrans(str) {
                return str
                    .replace(/\^([0-9])/g, function (str, color) { return "</span><span class=\"color-".concat(color, "\">"); })
                    .replace(/\^#([0-9A-F]{3,6})/gi, function (str, color) { return "</span><span class=\"color\" style=\"color: #".concat(color, "\">"); })
                    .replace(/~([a-z])~/g, function (str, color) { return "</span><span class=\"gameColor-".concat(color, "\">"); });
            }
        },
        escape: function (unsafe) {
            return String(unsafe)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
        },
    },
    props: {
        templates: {
            type: Object,
        },
        args: {
            type: Array,
        },
        params: {
            type: Object,
        },
        template: {
            type: String,
            default: null,
        },
        templateId: {
            type: String,
            default: config_1.default.defaultTemplateId,
        },
        multiline: {
            type: Boolean,
            default: false,
        },
        color: {
            type: Array,
            default: null,
        },
    },
});
