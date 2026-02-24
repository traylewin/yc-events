import { NextRequest, NextResponse } from "next/server";
import { Pinecone } from "@pinecone-database/pinecone";

const PINECONE_API_KEY = process.env.PINECONE_API_KEY!;
const INDEX_NAME = "users";
const EMBEDDING_MODEL = "multilingual-e5-large";

const pc = new Pinecone({ apiKey: PINECONE_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { query } = (await req.json()) as { query?: string };

    if (!query?.trim()) {
      return NextResponse.json(
        { error: "query is required" },
        { status: 400 },
      );
    }

    const embeddingRes = await pc.inference.embed({
      model: EMBEDDING_MODEL,
      inputs: [query],
      parameters: { inputType: "query", truncate: "END" },
    });

    const vector =
      (embeddingRes.data?.[0] as unknown as { values: number[] })?.values ?? [];

    if (vector.length === 0) {
      return NextResponse.json(
        { error: "Failed to generate embedding" },
        { status: 500 },
      );
    }

    const index = pc.index(INDEX_NAME);
    const results = await index.query({
      vector,
      topK: 10000,
      includeMetadata: true,
    });

    const suggestions = (results.matches ?? []).map((m) => ({
      userId: m.id,
      score: m.score ?? 0,
      metadata: m.metadata ?? {},
    }));

    return NextResponse.json({ suggestions });
  } catch (err) {
    console.error("suggest-attendees error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
