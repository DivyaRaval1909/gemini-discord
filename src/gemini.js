import dotenv from 'dotenv';

dotenv.config();

/**
 * Sends a question/prompt to Google Gemini via the official Generative Language REST API.
 * @param {string} prompt The user prompt.
 * @returns {Promise<string>} The generated text response.
 */
export async function askGemini(prompt) {
  const apiKey = process.env.GEMINI_API_KEY;
  const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in your .env file.');
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`;

  const requestBody = {
    contents: [
      {
        parts: [
          {
            text: prompt,
          },
        ],
      },
    ],
    systemInstruction: {
      parts: [
        {
          text:
            'You are an intelligent, friendly, and helpful AI assistant inside a Discord server. ' +
            'Format your responses cleanly using standard Discord markdown (bold, bullet points, syntax-highlighted code blocks). ' +
            'Keep your explanations concise, readable, and structured for Discord users.',
        },
      ],
    },
    generationConfig: {
      temperature: 0.7,
    },
  };

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-goog-api-key': apiKey,
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    if (!response.ok) {
      const errMsg = data?.error?.message || `HTTP ${response.status}: ${response.statusText}`;
      console.error('[Gemini API Error Response]:', data);
      throw new Error(errMsg);
    }

    const candidate = data.candidates?.[0];
    const text = candidate?.content?.parts?.map((p) => p.text).join('') || '';

    return text || "I didn't receive a text response from Gemini. Please try asking again.";
  } catch (error) {
    console.error('[Gemini Service Error]:', error.message);
    throw error;
  }
}
