"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var config_1 = require("./config");
var vue_1 = require("vue");
exports.default = vue_1.default.component('suggestions', {
    props: {
        message: {
            type: String
        },
        suggestions: {
            type: Array
        }
    },
    data: function () {
        return {};
    },
    computed: {
        currentSuggestions: function () {
            var _this = this;
            if (this.message === '') {
                return [];
            }
            var currentSuggestions = this.suggestions.filter(function (s) {
                if (!s.name.startsWith(_this.message)) {
                    var suggestionSplitted = s.name.split(' ');
                    var messageSplitted = _this.message.split(' ');
                    for (var i = 0; i < messageSplitted.length; i += 1) {
                        if (i >= suggestionSplitted.length) {
                            return i < suggestionSplitted.length + s.params.length;
                        }
                        if (suggestionSplitted[i] !== messageSplitted[i]) {
                            return false;
                        }
                    }
                }
                return true;
            }).slice(0, config_1.default.suggestionLimit);
            currentSuggestions.forEach(function (s) {
                // eslint-disable-next-line no-param-reassign
                s.disabled = !s.name.startsWith(_this.message);
                s.params.forEach(function (p, index) {
                    var wType = (index === s.params.length - 1) ? '.' : '\\S';
                    var regex = new RegExp("".concat(s.name, " (?:\\w+ ){").concat(index, "}(?:").concat(wType, "*)$"), 'g');
                    // eslint-disable-next-line no-param-reassign
                    // @ts-ignore
                    p.disabled = _this.message.match(regex) == null;
                });
            });
            return currentSuggestions;
        },
    },
    methods: {},
});
