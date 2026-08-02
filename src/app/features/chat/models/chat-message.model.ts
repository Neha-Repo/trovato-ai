export type ChatMessageSender = 'user' | 'assistant';

export interface ChatMessage {
  id: string;
  sender: ChatMessageSender;
  text: string;
  createdAt: Date;
}