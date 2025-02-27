import React, { useEffect, useState } from 'react';
import { useSocket } from '../contexts/SocketContext';
import { useChat } from '../hooks/useChat';

const ChatTest: React.FC = () => {
  const { socket, connected } = useSocket();
  const testChatId = 'test-chat-123';
  const { messages, sendMessage, loading, error } = useChat(testChatId, false);
  const [messageText, setMessageText] = useState('');

  useEffect(() => {
    console.log('Socket connected:', connected);
    console.log('Current messages:', messages);
  }, [connected, messages]);

  const handleSend = async () => {
    if (!messageText.trim()) return;
    try {
      await sendMessage(testChatId, messageText);
      setMessageText('');
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  return (
    <div className="p-4">
      <div className="mb-4">
        <p>Socket Status: {connected ? '🟢 Connected' : '🔴 Disconnected'}</p>
        <p>Loading: {loading ? 'Yes' : 'No'}</p>
        {error && <p className="text-red-500">Error: {error}</p>}
      </div>

      <div className="border rounded p-4 mb-4 h-64 overflow-y-auto">
        {messages.map((msg, index) => (
          <div key={msg.id || index} className="mb-2">
            <strong>{msg.senderId}:</strong> {msg.content}
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          className="flex-1 border rounded px-2 py-1"
          placeholder="Type a message..."
        />
        <button
          onClick={handleSend}
          className="bg-blue-500 text-white px-4 py-1 rounded"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatTest;