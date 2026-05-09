"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface Objection { quote: string; type: string; howHandled: string; betterRebuttal: string; followUp: string; }
interface Analysis {
  callScore: number; verdict: string; objections: Objection[]; buyingSignals: string[];
  missedOpportunities: string[]; strengths: string[]; nextSteps: string[]; coachingTips: string[];
}

const objTypeColor: Record<string, string> = {
  Price: "bg-red-100 text-red-700", Timing: "bg-yellow-100 text-yellow-700",
  Authority: "bg-purple-100 text-purple-700", Need: "bg-blue-100 text-blue-700",
  Trust: "bg-orange-100 text-orange-700", Competition: "bg-slate-100 text-slate-700",
};

const SAMPLE = `Rep: Hi Sarah, thanks for taking my call. I wanted to follow up on the demo we did last week.
Prospect: Oh right, yeah. Look, I will be honest - we are looking at a few options and yours is quite a bit more expensive.
Rep: I understand price is a concern. We do have flexible plans.
Prospect: It is not just the price. We are also in the middle of a big migration project right now, so timing is not great.
Rep: That makes sense. When do you think the migration will wrap up?
Prospect: Probably Q3. But honestly, our current solution does most of what we need.
Rep: What is missing from your current solution?
Prospect: Reporting is pretty weak and the integrations are painful. Your demo looked good for that.
Rep: Those are exactly the areas we specialize in. Want me to send over some case studies?
Prospect: Sure, you can send those.`;

export default function Home() {
  const [transcript, setTranscript] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function coach() {
    if (!transcript.trim()) return;
    setLoading(true); setError(""); setAnalysis(null);
    try {
      const res = await fetch("/api/coach-call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript, productDescription }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setAnalysis(data);
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Unknown error"); }
    finally { setLoading(false); }
  }

  const scoreColor = !analysis ? "" : analysis.callScore >= 75 ? "text-green-400" : analysis.callScore >= 50 ? "text-yellow-400" : "text-red-400";

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-gray-800 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center gap-3">
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-slate-900 text-sm font-bold">C</div>
          <div>
            <h1 className="text-lg font-semibold">Sales Call Coach</h1>
            <p className="text-xs text-gray-400">AI-powered objection handling and call analysis</p>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Call Transcript</CardTitle>
            <CardDescription className="text-gray-400">Paste your call transcript for AI coaching.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label className="text-gray-300">Product / Service</Label>
              <Input placeholder="e.g. Project management SaaS, $49/mo" value={productDescription} onChange={e => setProductDescription(e.target.value)} className="bg-gray-800 border-gray-700 text-white" />
            </div>
            <Textarea
              placeholder="Paste call transcript here..."
              className="min-h-64 bg-gray-800 border-gray-700 text-white font-mono text-sm"
              value={transcript}
              onChange={e => setTranscript(e.target.value)}
            />
            <button onClick={() => setTranscript(SAMPLE)} className="text-xs text-emerald-400 hover:underline">Load sample transcript</button>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <Button onClick={coach} disabled={loading || !transcript.trim()} className="w-full bg-emerald-600 hover:bg-emerald-700">
              {loading ? "Analyzing call..." : "Analyze and Coach"}
            </Button>
          </CardContent>
        </Card>

        {analysis && (
          <div className="space-y-4">
            <Card className="bg-gray-900 border-gray-800 text-center py-6">
              <div className={`text-5xl font-bold ${scoreColor}`}>{analysis.callScore}</div>
              <div className="text-gray-400 text-sm mt-1">Call Score / 100</div>
              <p className="text-gray-300 text-xs mt-3 px-8 italic">&quot;{analysis.verdict}&quot;</p>
            </Card>

            {analysis.objections.length > 0 && (
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader><CardTitle className="text-white">Objections and Rebuttals</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  {analysis.objections.map((obj, i) => (
                    <div key={i} className="border border-gray-700 rounded-lg p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <Badge className={objTypeColor[obj.type] || "bg-gray-700 text-gray-300"}>{obj.type}</Badge>
                        <span className="text-gray-300 text-sm italic">&quot;{obj.quote}&quot;</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-red-900/20 rounded p-3">
                          <p className="text-xs text-red-400 font-medium mb-1">How it was handled:</p>
                          <p className="text-sm text-gray-300">{obj.howHandled}</p>
                        </div>
                        <div className="bg-emerald-900/20 rounded p-3">
                          <p className="text-xs text-emerald-400 font-medium mb-1">Better rebuttal:</p>
                          <p className="text-sm text-gray-300">&quot;{obj.betterRebuttal}&quot;</p>
                        </div>
                      </div>
                      <p className="text-xs text-blue-400">Follow-up: {obj.followUp}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-3 gap-4">
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader><CardTitle className="text-emerald-400 text-sm">Buying Signals</CardTitle></CardHeader>
                <CardContent><ul className="space-y-1">{analysis.buyingSignals.map((s, i) => <li key={i} className="text-sm text-gray-300 flex gap-2"><span className="text-emerald-400">+</span>{s}</li>)}</ul></CardContent>
              </Card>
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader><CardTitle className="text-yellow-400 text-sm">Missed Opportunities</CardTitle></CardHeader>
                <CardContent><ul className="space-y-1">{analysis.missedOpportunities.map((s, i) => <li key={i} className="text-sm text-gray-300 flex gap-2"><span className="text-yellow-400">!</span>{s}</li>)}</ul></CardContent>
              </Card>
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader><CardTitle className="text-blue-400 text-sm">Next Steps</CardTitle></CardHeader>
                <CardContent><ul className="space-y-1">{analysis.nextSteps.map((s, i) => <li key={i} className="text-sm text-gray-300 flex gap-2"><span className="text-blue-400">{i+1}.</span>{s}</li>)}</ul></CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
