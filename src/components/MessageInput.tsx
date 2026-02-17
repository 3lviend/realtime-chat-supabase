import React, { useState } from 'react';

type MessageInputProps = {
  onSend: (content: string) => void;
};

export default function MessageInput({ onSend }: MessageInputProps) {
  const [value, setValue] = useState('');

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!value.trim()) return;
        onSend(value.trim());
        setValue('');
      }}
    >
      <input value={value} onChange={(e) => setValue(e.target.value)} />
      <button type="submit">Send</button>
    </form>
  );
}

