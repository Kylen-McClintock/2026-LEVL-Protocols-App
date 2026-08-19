const React = require('react');
const { renderToString } = require('react-dom/server');
const { useChat } = require('@ai-sdk/react');

function Test() {
  const chat = useChat();
  console.log("USE_CHAT_KEYS:", Object.keys(chat));
  return React.createElement('div', null, 'hello');
}

renderToString(React.createElement(Test));
