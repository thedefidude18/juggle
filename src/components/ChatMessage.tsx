interface ChatMessageProps {
  message: Message;
  isOwnMessage: boolean;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, isOwnMessage }) => {
  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[70%] ${isOwnMessage ? 'bg-blue-500 text-white' : 'bg-gray-100'} rounded-lg p-3`}>
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-sm">
            {message.sender.username}
          </span>
          {message.sender.is_matched && (
            <span className="px-2 py-0.5 text-xs bg-green-500 text-white rounded-full">
              Matched
            </span>
          )}
        </div>
        <p className="text-sm">{message.content}</p>
      </div>
    </div>
  );
};