type TypingIndicatorProps = {
  label?: string;
};

export default function TypingIndicator({ label = 'Typing' }: TypingIndicatorProps) {
  return (
    <div className="typingBubble" aria-live="polite" aria-label={`${label}…`}>
      <span className="subtle">{label}</span>
      <span className="dots" aria-hidden="true">
        <span className="dot" />
        <span className="dot" />
        <span className="dot" />
      </span>
    </div>
  );
}

