import React from 'react';
import type { Message } from '../types/message';

type MessageListProps = {
  messages: Message[];
};

export default function MessageList({ messages }: MessageListProps) {
  return (
    <ul>
      {messages.map((m) => (
        <li key={m.id}>{m.content}</li>
      ))}
    </ul>
  );
}

