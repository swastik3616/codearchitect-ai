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

  async explainFile(url: string, filePath: string) {
    const res = await fetch(`${API_URL}/explain-file`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, file_path: filePath }),
    });
    if (!res.ok) throw new Error('Failed to explain file');
    return res.json();
  },

  async searchCode(url: string, query: string) {
    const res = await fetch(`${API_URL}/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, query }),
    });
    if (!res.ok) throw new Error('Failed to search');
    return res.json();
  },

  async getCodeQuality(url: string) {
    const res = await fetch(`${API_URL}/code-quality`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });
    if (!res.ok) throw new Error('Failed to get code quality report');
    return res.json();
  },
};
