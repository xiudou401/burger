import { NextFunction, Request, Response } from 'express';
import { chatWithMenuAssistant } from '../services/assistant.service';
import type { AssistantChatRequestPayload } from '../validation/assistant.schema';

export const chatWithAssistantHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { message } = req.body as AssistantChatRequestPayload;
    const assistantResponse = await chatWithMenuAssistant(message);

    res.status(200).json(assistantResponse);
  } catch (error) {
    next(error);
  }
};
