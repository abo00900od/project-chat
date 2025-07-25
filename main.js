// Initialize the app when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  const instance = new Vue({
    el: '#app',
    template: `
      <div id="app">
        <div class="chat-window" :style="this.style" :class="{
            'animated': !showWindow && hideAnimated,
            'hidden': !showWindow
          }">
          <div class="chat-messages" ref="messages">
            <div class="msg" v-for="msg in filteredMessages" :key="msg.id">
              <span v-html="formatMessage(msg)"></span>
            </div>
          </div>
        </div>
        <div class="chat-input">
          <div v-show="showInput" class="input">
            <span class="prefix" :class="{ any: modes.length > 1 }" :style="{ color: modeColor }">{{modePrefix}}</span>
            <textarea v-model="message"
                      ref="input"
                      type="text"
                      autofocus
                      spellcheck="false"
                      rows="1"
                      @keyup.esc="hideInput"
                      @keyup="keyUp"
                      @keydown="keyDown"
                      @keypress.enter.prevent="send">
            </textarea>
          </div>
          <div class="suggestions-wrap" v-show="currentSuggestions.length > 0">
            <ul class="suggestions">
              <li class="suggestion" v-for="s in currentSuggestions" :key="s.name">
                <p>
                  <span :class="{ 'disabled': s.disabled }">
                    {{s.name}}
                  </span>
                  <span class="param"
                        v-for="p in s.params"
                        :class="{ 'disabled': p.disabled }"
                        :key="p.name">
                    [{{p.name}}]
                  </span>
                </p>
                <small class="help">
                  <template v-if="!s.disabled">
                    {{s.help}}
                  </template>
                  <template v-for="p in s.params" v-if="!p.disabled">
                    {{p.help}}
                  </template>
                </small>
              </li>
            </ul>
          </div>
          <div class="chat-hide-state" v-show="showHideState">
            {{hideStateString}}
          </div>
        </div>
      </div>
    `,
    data() {
      return {
        style: {
          background: 'rgba(52, 73, 94, 0.7)',
          width: '38vw',
          height: '22%',
        },
        showInput: true,
        showWindow: true,
        showHideState: false,
        hideState: 0,
        backingSuggestions: [],
        removedSuggestions: [],
        templates: {
          'default': '<b>{0}</b>: {1}',
          'defaultAlt': '{0}',
          'print': '<pre>{0}</pre>',
          'example:important': '<h1>^2{0}</h1>'
        },
        message: "",
        messages: [
          { id: '1', args: ['System', 'Welcome to the chat!'], template: 'default' },
          { id: '2', args: ['User', 'Hello world!'], template: 'default' },
          { id: '3', args: ['Another User', 'This is a longer message to test how the chat handles multiple lines and longer content.'], template: 'default' }
        ],
        oldMessages: [],
        oldMessagesIndex: -1,
        focusTimer: 0,
        showWindowTimer: 0,
        showHideStateTimer: 0,
        modes: [
          { name: 'all', displayName: 'All', color: '#fff' },
          { name: '_global', displayName: 'All', color: '#fff', isGlobal: true, hidden: true }
        ],
        modeIdx: 0,
      };
    },
    computed: {
      filteredMessages() {
        return this.messages;
      },
      suggestions() {
        return this.backingSuggestions.filter(
          el => this.removedSuggestions.indexOf(el.name) <= -1
        );
      },
      currentSuggestions() {
        if (this.message === '') {
          return [];
        }
        return this.suggestions.filter((s) => {
          return s.name.startsWith(this.message);
        }).slice(0, 5);
      },
      hideAnimated() {
        return this.hideState !== 2;
      },
      modeIdxGet() {
        return (this.modeIdx >= this.modes.length) ? (this.modes.length - 1) : this.modeIdx;
      },
      modePrefix() {
        if (this.modes.length === 2) {
          return '➤';
        }
        return this.modes[this.modeIdxGet].displayName;
      },
      modeColor() {
        return this.modes[this.modeIdxGet].color;
      },
      hideStateString() {
        switch (this.hideState) {
          case 1: return 'Visible';
          case 2: return 'Hidden';
          case 0: return 'When active';
        }
      }
    },
    methods: {
      formatMessage(msg) {
        let s = msg.template ? msg.template : this.templates[msg.templateId || 'default'];
        s = s.replace(/{(\d+)}/g, (match, number) => {
          return msg.args[number] != undefined ? this.escape(msg.args[number]) : match;
        });
        return this.colorize(s);
      },
      colorize(str) {
        let s = "<span>" + this.colorTrans(str) + "</span>";
        const styleDict = {
          '*': 'font-weight: bold;',
          '_': 'text-decoration: underline;',
          '~': 'text-decoration: line-through;',
          '=': 'text-decoration: underline line-through;',
          'r': 'text-decoration: none;font-weight: normal;',
        };
        const styleRegex = /\^(\_|\*|\=|\~|\/|r)(.*?)(?=$|\^r|<\/em>)/;
        while (s.match(styleRegex)) {
          s = s.replace(styleRegex, (str, style, inner) => `<em style="${styleDict[style]}">${inner}</em>`)
        }
        return s.replace(/<span[^>]*><\/span[^>]*>/g, '');
      },
      colorTrans(str) {
        return str
          .replace(/\^([0-9])/g, (str, color) => `</span><span class="color-${color}">`)
          .replace(/\^#([0-9A-F]{3,6})/gi, (str, color) => `</span><span class="color" style="color: #${color}">`)
          .replace(/~([a-z])~/g, (str, color) => `</span><span class="gameColor-${color}">`);
      },
      escape(unsafe) {
        return String(unsafe)
         .replace(/&/g, '&amp;')
         .replace(/</g, '&lt;')
         .replace(/>/g, '&gt;')
         .replace(/"/g, '&quot;')
         .replace(/'/g, '&#039;');
      },
      keyUp() {
        this.resize();
      },
      keyDown(e) {
        if (e.which === 38 || e.which === 40) {
          e.preventDefault();
          this.moveOldMessageIndex(e.which === 38);
        }
        this.resize();
      },
      moveOldMessageIndex(up) {
        if (up && this.oldMessages.length > this.oldMessagesIndex + 1) {
          this.oldMessagesIndex += 1;
          this.message = this.oldMessages[this.oldMessagesIndex];
        } else if (!up && this.oldMessagesIndex - 1 >= 0) {
          this.oldMessagesIndex -= 1;
          this.message = this.oldMessages[this.oldMessagesIndex];
        } else if (!up && this.oldMessagesIndex - 1 === -1) {
          this.oldMessagesIndex = -1;
          this.message = "";
        }
      },
      resize() {
        const input = this.$refs.input;
        if (input) {
          const style = getComputedStyle(input);
          const paddingRemove = parseFloat(style.paddingBottom) + parseFloat(style.paddingTop);
          input.style.height = "5px";
          input.style.height = `${input.scrollHeight - paddingRemove}px`;
        }
      },
      send() {
        if (this.message !== "") {
          this.messages.push({
            id: Date.now().toString(),
            args: ['You', this.message],
            template: 'default'
          });
          this.oldMessages.unshift(this.message);
          this.oldMessagesIndex = -1;
          this.hideInput();
        } else {
          this.hideInput(true);
        }
      },
      hideInput(canceled = false) {
        setTimeout(() => {
          const input = this.$refs.input;
          if (input) {
            input.style.height = '';
          }
        }, 50);
        this.message = "";
        this.showInput = false;
      }
    },
    mounted() {
      // Simulate some activity for demo
      setTimeout(() => {
        this.showInput = true;
      }, 1000);
    }
  });
});
