const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const api = {
  async analyzeRepo(url: string) {
    const res = await fetch(`${API_URL}/analyze-repo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });
    if (!res.ok) throw new Error('Failed to analyze repository');
    return res.json();
  },

  async pollStatus(taskId: string) {
    const res = await fetch(`${API_URL}/analyze-status/${taskId}`);
    if (!res.ok) throw new Error('Task not found');
    return res.json();
  },

  async askQuestion(url: string, question: string) {
    const res = await fetch(`${API_URL}/ask-question`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, question }),
    });
    if (!res.ok) throw new Error('Failed to ask question');
    return res.json();
  },

  async getStructure() {
    const res = await fetch(`${API_URL}/repo-structure`);
    if (!res.ok) throw new Error('Failed to get structure');
    return res.json();
  }
};
