export interface LlmPort {
  generateJson(prompt: string, repairPrompt?: string): Promise<string>;
}

export const LLM_PORT = Symbol('LLM_PORT');
