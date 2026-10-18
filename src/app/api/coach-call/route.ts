import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { capMaxTokens, formatZodError, guardDemoRequest, MAX_OUTPUT_TOKENS } from "@/lib/demo-guard";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const TRANSCRIPT_MAX = 12_000;
const PRODUCT_MAX = 500;

const bodySchema = z
  .object({
    transcript: z.string().trim().min(1).max(TRANSCRIPT_MAX),
    productDescription: z.string().trim().max(PRODUCT_MAX).optional().default(""),
  })
  .strict();

export async function POST(req: NextRequest) {
  const blocked = await guardDemoRequest(req);
  if (blocked) return blocked;

  let json: unknown;
  try {
    const raw = await req.text();
    if (raw.length > TRANSCRIPT_MAX + PRODUCT_MAX + 1_000) {
      return NextResponse.json({ error: "Request body is too large" }, { status: 400 });
    }
    json = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
  }

  const { transcript, productDescription } = parsed.data;

  let message;
  try {
    message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: capMaxTokens(MAX_OUTPUT_TOKENS),
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
  } catch {
    // Do not log this error. Provider failures can echo request metadata.
    return NextResponse.json({ error: "The coaching request could not be completed" }, { status: 502 });
  }

  const content = message.content[0];
  if (!content || content.type !== "text") {
    return NextResponse.json({ error: "Unexpected response" }, { status: 500 });
  }

  try {
    const text = content.text.trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? jsonMatch[0] : text;
    return NextResponse.json(JSON.parse(jsonStr));
  } catch {
    return NextResponse.json({ error: "Failed to parse" }, { status: 500 });
  }
}
