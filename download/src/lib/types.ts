export type Persona = {
  name: string;
  traits: string;
  interests: string;
  writingStyle: string;
};

export type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  avatar?: string;
};



export type Recommendation = {
  message_index: number;
  user_message: string;
  assistant_response: string;
  rating: number;
  suggestion: string;
  next_move: string;
};
