import { GoogleGenerativeAI } from "@google/generative-ai";
import type { RewrittenContent } from "@/types/api";

const DEFAULT_PROMPT = `You are an expert content writer and SEO specialist. Rewrite the following article completely while preserving all facts and information. 

Requirements:
- Write in a human-readable, engaging style
- Optimize for SEO with natural keyword usage
- Use unique wording - no plagiarism
- Include proper H2 and H3 headings
- Add a FAQ section at the end with 3-5 common questions and answers
- Add a conclusion section
- Keep the original meaning and key facts
- Output valid HTML only

Return a JSON object with exactly these fields:
{
  "title": "SEO-optimized title",
  "content": "Full HTML content of the article",
  "metaDescription": "150-160 character meta description",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
}`;

export async function rewriteContent(
  title: string,
  content: string,
  apiKey: string,
  customPrompt?: string
): Promise<RewrittenContent> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = customPrompt || DEFAULT_PROMPT;

  const fullPrompt = `${prompt}

Original Title: ${title}

Original Content:
${content}

Return ONLY valid JSON, no markdown code blocks, no extra text.`;

  const result = await model.generateContent(fullPrompt);
  const text = result.response.text().trim();

  const cleanText = text.replace(/^```json\n?/, "").replace(/\n?```$/, "").trim();

  const parsed = JSON.parse(cleanText) as RewrittenContent;

  if (!parsed.title || !parsed.content || !parsed.metaDescription || !parsed.tags) {
    throw new Error("Invalid response structure from Gemini API");
  }

  return parsed;
}
