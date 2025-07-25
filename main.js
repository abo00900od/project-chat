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
            <div v-for="msg in filteredMessages" 
                 :key="msg.id" 
                 class="msg"
                 :class="getMessageClass(msg)">
              <div class="message-header" v-if="showMessageHeader(msg)">
                {{getMessageSender(msg)}}
              </div>
              <div class="message-bubble">
                <span v-html="formatMessage(msg)"></span>
                <div class="message-time">{{getMessageTime(msg)}}</div>
              </div>
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
                      placeholder="Type a message..."
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
                    {{p.name}}
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
          background: 'var(--chat-bg)',
          width: '38vw',
          height: '22%',
        },
        showInput: true,
        showWindow: true,
        showHideState: false,
        hideState: 0,
        backingSuggestions: [
          { name: '/help', help: 'Show available commands', params: [], disabled: false },
          { name: '/clear', help: 'Clear chat history', params: [], disabled: false },
          { name: '/status', help: 'Show current status', params: ['message'], disabled: false }
        ],
        removedSuggestions: [],
        templates: {
          'default': '<strong>{0}</strong>: {1}',
          'defaultAlt': '{0}',
          'print': '<pre>{0}</pre>',
          'system': '<em>⚙️ {0}</em>',
          'example:important': '<h1>^2{0}</h1>'
        },
        message: "",
        messages: [
          { 
            id: '1', 
            args: ['System', 'Welcome to the modern chat interface!'], 
            template: 'system',
            type: 'system',
            timestamp: Date.now() - 300000
          },
          { 
            id: '2', 
            args: ['Alice', 'Hey everyone! 👋'], 
            template: 'default',
            type: 'other',
            timestamp: Date.now() - 120000
          },
          { 
            id: '3', 
            args: ['Bob', 'This new interface looks amazing! The design is so much better than before.'], 
            template: 'default',
            type: 'other',
            timestamp: Date.now() - 60000
          },
          { 
            id: '4', 
            args: ['You', 'I agree! The message bubbles and colors make it much easier to follow conversations.'], 
            template: 'default',
            type: 'own',
            timestamp: Date.now() - 30000
          },
          { 
            id: '5', 
            args: ['System', 'Chat interface updated successfully ✅'], 
            template: 'system',
            type: 'system',
            timestamp: Date.now() - 10000
          }
        ],
        oldMessages: [],
        oldMessagesIndex: -1,
        focusTimer: 0,
        showWindowTimer: 0,
        showHideStateTimer: 0,
        modes: [
          { name: 'all', displayName: 'All', color: '#0084ff' },
          { name: '_global', displayName: 'Global', color: '#42b883', isGlobal: true, hidden: true }
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
          return s.name.toLowerCase().startsWith(this.message.toLowerCase());
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
          return '💬';
        }
        return this.modes[this.modeIdxGet].displayName;
      },
      modeColor() {
        return this.modes[this.modeIdxGet].color;
      },
      hideStateString() {
        switch (this.hideState) {
          case 1: return 'Always Visible';
          case 2: return 'Hidden';
          case 0: return 'Show When Active';
        }
      }
    },
    methods: {
      getMessageClass(msg) {
        return {
          'message-own': msg.type === 'own',
          'message-other': msg.type === 'other',
          'message-system': msg.type === 'system',
          'multiline': msg.multiline
        };
      },
      
      showMessageHeader(msg) {
        return msg.type !== 'system' && msg.type !== 'own';
      },
      
      getMessageSender(msg) {
        if (msg.args && msg.args.length > 0) {
          return msg.args[0];
        }
        return 'Unknown';
      },
      
      getMessageTime(msg) {
        if (msg.timestamp) {
          const date = new Date(msg.timestamp);
          return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
        return '';
      },
      
      formatMessage(msg) {
        let s = msg.template ? msg.template : this.templates[msg.templateId || 'default'];
        
        // For system messages, show only the message content
        if (msg.type === 'system') {
          s = this.templates['system'];
          s = s.replace(/{(\d+)}/g, (match, number) => {
            return msg.args[number] != undefined ? this.escape(msg.args[number]) : match;
          });
        } else {
          // For regular messages, show only the message content (skip sender name)
          if (msg.args && msg.args.length > 1) {
            return this.escape(msg.args[1]); // Return just the message content
          }
        }
        
        // Format variant args
        s = s.replace(/\{\{([a-zA-Z0-9_\-]+?)\}\}/g, (match, id) => {
          const argEscaped = msg.params && msg.params[id] != undefined ? this.escape(msg.params[id]) : match;
          return argEscaped;
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
          input.style.height = "auto";
          input.style.height = `${Math.min(input.scrollHeight, 120)}px`;
        }
      },
      
      send() {
        if (this.message !== "") {
          const newMessage = {
            id: Date.now().toString(),
            args: ['You', this.message],
            template: 'default',
            type: 'own',
            timestamp: Date.now()
          };
          this.messages.push(newMessage);
          this.oldMessages.unshift(this.message);
          this.oldMessagesIndex = -1;
          
          // Simulate a response for demo purposes
          setTimeout(() => {
            const responses = [
              'That\'s interesting!',
              'I see what you mean 🤔',
              'Thanks for sharing!',
              'Good point! 👍',
              'Let me think about that...'
            ];
            const randomResponse = responses[Math.floor(Math.random() * responses.length)];
            this.messages.push({
              id: (Date.now() + 1).toString(),
              args: ['Assistant', randomResponse],
              template: 'default',
              type: 'other',
              timestamp: Date.now()
            });
          }, 1000 + Math.random() * 2000);
          
          this.message = "";
          this.$nextTick(() => {
            this.scrollToBottom();
          });
        }
      },
      
      scrollToBottom() {
        const messagesContainer = this.$refs.messages;
        if (messagesContainer) {
          messagesContainer.scrollTop = messagesContainer.scrollHeight;
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
    
    watch: {
      messages() {
        this.$nextTick(() => {
          this.scrollToBottom();
        });
      }
    },
    
    mounted() {
      // Auto-scroll to bottom on mount
      this.$nextTick(() => {
        this.scrollToBottom();
      });
      
      // Simulate some activity for demo
      setTimeout(() => {
        this.showInput = true;
      }, 500);
    }
  });
});
