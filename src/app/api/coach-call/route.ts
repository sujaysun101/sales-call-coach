import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const { transcript, productDescription } = await req.json();

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 3000,
    messages: [
      {
        role: "user",
        content: `You are an elite sales coach. Analyze this sales call and return a JSON coaching report.

Product/Service: ${productDescription || "Not specified"}

CALL TRANSCRIPT:
${transcript}

Return ONLY this JSON:
{
  "callScore": 72,
  "verdict": "one sentence overall assessment",
  "objections": [
    {
      "quote": "exact or paraphrased objection from prospect",
      "type": "Price",
      "howHandled": "how the rep actually handled it",
      "betterRebuttal": "specific script they should have used",
      "followUp": "follow-up question to ask"
    }
  ],
  "buyingSignals": ["specific signals showing prospect interest"],
  "missedOpportunities": ["moments rep could have advanced the sale"],
  "strengths": ["what the rep did well"],
  "nextSteps": ["specific actions to advance this deal"],
  "coachingTips": ["top 3 personalized tips for this rep"]
}

callScore is 0-100. type must be one of: Price, Timing, Authority, Need, Trust, Competition`,
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== "text") return NextResponse.json({ error: "Unexpected response" }, { status: 500 });

  try {
    const text = content.text.trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? jsonMatch[0] : text;
    return NextResponse.json(JSON.parse(jsonStr));
  } catch {
    return NextResponse.json({ error: "Failed to parse" }, { status: 500 });
  }
}
