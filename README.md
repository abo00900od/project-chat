# Project Chat - Modern Interface

A modern, responsive chat interface built with Vue.js and TypeScript.

## Features

- **Modern Design**: Dark theme with message bubbles and smooth animations
- **Real-time Messaging**: Send and receive messages with auto-responses
- **Command Suggestions**: Auto-complete for commands starting with `/`
- **User Distinction**: Different styling for own vs other users' messages
- **Timestamps**: Show when each message was sent
- **System Messages**: Special styling for system notifications
- **Responsive**: Works on different screen sizes

## Quick Start

1. Open `index.html` in a web browser
2. Start typing messages in the input field
3. Try typing `/help` to see command suggestions
4. Press Enter to send messages

## Project Structure

- `index.html` - Main HTML file
- `main.js` - Vue.js application logic
- `index.css` - Modern chat interface styles
- `latofonts.css` - Font definitions
- `vue.min.js` - Vue.js framework

## Development

To make changes:

1. Edit the CSS in `index.css` for styling changes
2. Edit the Vue.js logic in `main.js` for functionality changes
3. Refresh the browser to see changes

## Browser Compatibility

Works in all modern browsers that support:
- CSS Grid and Flexbox
- ES6+ JavaScript features
- Vue.js 2.7+

## Demo Messages

The interface comes with demo messages to showcase the different message types:
- System messages with icons
- User messages from different people
- Your own messages (right-aligned, blue)
- Timestamps for all messages

## Customization

You can easily customize:
- Colors by editing CSS variables in `index.css`
- Message templates in the Vue.js data
- Animations and transitions
- Command suggestions
