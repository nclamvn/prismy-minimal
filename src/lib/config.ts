export const config = {
  ai: {
    openai: {
      apiKey: process.env.OPENAI_API_KEY!,
      model: "gpt-4-turbo-preview",
    },
    anthropic: {
      apiKey: process.env.ANTHROPIC_API_KEY!,
      model: "claude-3-opus-20240229",
    },
  },
  upload: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    acceptedFormats: [".pdf", ".doc", ".docx"],
  },
};
