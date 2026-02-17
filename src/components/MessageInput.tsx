import { useEffect, useRef, useState } from 'react';

type MessageInputProps = {
  onSend: (content: string) => void;
  onTyping?: () => void;
  disabled?: boolean;
};

export default function MessageInput({ onSend, onTyping, disabled = false }: MessageInputProps) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = '0px';
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
  }, [value]);

  return (
    <form
      className="composerForm"
      onSubmit={(e) => {
        e.preventDefault();
        if (disabled) return;
        if (!value.trim()) return;
        onSend(value.trim());
        setValue('');
      }}
    >
      <textarea
        ref={textareaRef}
        className="composerInput"
        value={value}
        placeholder="Message…"
        disabled={disabled}
        onChange={(e) => {
          setValue(e.target.value);
          onTyping?.();
        }}
        onKeyDown={(e) => {
          // Enter to send, Shift+Enter for newline (ChatGPT-style)
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (disabled) return;
            const trimmed = value.trim();
            if (!trimmed) return;
            onSend(trimmed);
            setValue('');
          }
        }}
      />
      <button type="submit" disabled={disabled || !value.trim()}>
        Send
      </button>
    </form>
  );
}

