import { FormEvent, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChevronDown,
  faComments,
  faPaperPlane,
} from '@fortawesome/free-solid-svg-icons';
import { chatWithMenuAssistant } from '../../../api/assistant';
import { ApiError } from '../../../api/request';
import { formatCurrency } from '../../../utils/currency';
import type { AssistantRecommendation } from '../../../types/assistant';
import classes from './MenuAssistantPanel.module.css';

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  recommendations?: AssistantRecommendation[];
  refused?: boolean;
};

const QUICK_PROMPTS = [
  'Recommend a burger combo',
  'What can I get under $15?',
  'Any dessert picks?',
];

const createMessageId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;

const getErrorMessage = (error: unknown) => {
  if (error instanceof ApiError) {
    return error.message;
  }

  return 'The assistant is taking a break. Please try again.';
};

const RecommendationCard = ({ item }: { item: AssistantRecommendation }) => (
  <article className={classes.RecommendationCard}>
    <div>
      <strong>{item.name}</strong>
      <span>{item.category}</span>
    </div>
    <p>{item.reason || item.description || 'Available on the current menu.'}</p>
    <b>{formatCurrency(item.priceCents)}</b>
  </article>
);

const MenuAssistantPanel = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: 'Ask me for a menu pick, budget idea, or category recommendation.',
    },
  ]);
  const inputRef = useRef<HTMLInputElement>(null);

  const sendMessage = async (message: string) => {
    const trimmed = message.trim();

    if (!trimmed || isSending) return;

    setMessages((current) => [
      ...current,
      { id: createMessageId(), role: 'user', text: trimmed },
    ]);
    setInput('');
    setIsSending(true);

    try {
      const response = await chatWithMenuAssistant(trimmed);

      setMessages((current) => [
        ...current,
        {
          id: createMessageId(),
          role: 'assistant',
          text: response.reply,
          recommendations: response.recommendations,
          refused: response.refused,
        },
      ]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          id: createMessageId(),
          role: 'assistant',
          text: getErrorMessage(error),
          refused: true,
        },
      ]);
    } finally {
      setIsSending(false);
      window.setTimeout(() => inputRef.current?.focus(), 0);
    }
  };

  const submitHandler = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void sendMessage(input);
  };

  const openPanel = () => {
    setIsOpen(true);
    window.setTimeout(() => inputRef.current?.focus(), 0);
  };

  if (!isOpen) {
    return (
      <button
        type="button"
        className={classes.Launcher}
        onClick={openPanel}
        aria-label="Open menu assistant"
      >
        <FontAwesomeIcon icon={faComments} />
        <span>Menu Assistant</span>
      </button>
    );
  }

  return (
    <section className={classes.Panel} aria-label="Menu assistant">
      <header className={classes.Header}>
        <div>
          <span>AI Menu Assistant</span>
          <small>Live menu only</small>
        </div>
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          aria-label="Minimize menu assistant"
        >
          <FontAwesomeIcon icon={faChevronDown} />
        </button>
      </header>

      <div className={classes.Messages}>
        {messages.map((message) => (
          <div
            key={message.id}
            className={`${classes.Message} ${
              message.role === 'user' ? classes.UserMessage : ''
            } ${message.refused ? classes.RefusedMessage : ''}`}
          >
            <p>{message.text}</p>
            {message.recommendations?.map((item) => (
              <RecommendationCard item={item} key={item.id} />
            ))}
          </div>
        ))}
        {isSending && (
          <div className={classes.Message}>
            <p>Checking the current menu...</p>
          </div>
        )}
      </div>

      <div className={classes.Prompts}>
        {QUICK_PROMPTS.map((prompt) => (
          <button
            type="button"
            key={prompt}
            onClick={() => {
              void sendMessage(prompt);
            }}
            disabled={isSending}
          >
            {prompt}
          </button>
        ))}
      </div>

      <form className={classes.Form} onSubmit={submitHandler}>
        <input
          ref={inputRef}
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Ask for a menu recommendation"
          maxLength={500}
        />
        <button
          type="submit"
          aria-label="Send message"
          disabled={!input.trim() || isSending}
        >
          <FontAwesomeIcon icon={faPaperPlane} />
        </button>
      </form>
    </section>
  );
};

export default MenuAssistantPanel;
