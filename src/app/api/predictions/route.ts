import { NextResponse } from "next/server";
import { getHeadToHead } from "@/services/football-api";
import { calculateMatchPrediction } from "@/utils/prediction-util";
import { Match } from "@/types/football.types"; // Ensure Match type is imported if needed

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const homeTeamIdParam = searchParams.get("homeTeamId");
  const awayTeamIdParam = searchParams.get("awayTeamId");

  if (!homeTeamIdParam || !awayTeamIdParam) {
    return NextResponse.json(
      { error: "Missing homeTeamId or awayTeamId query parameter" },
      { status: 400 }
    );
  }

  const homeTeamId = parseInt(homeTeamIdParam, 10);
  const awayTeamId = parseInt(awayTeamIdParam, 10);

  if (isNaN(homeTeamId) || isNaN(awayTeamId)) {
    return NextResponse.json(
      { error: "Invalid team IDs provided" },
      { status: 400 }
    );
  }

  try {
    // Fetch head-to-head data securely on the server
    // getHeadToHead internally uses fetchWithErrorHandling which reads the server-side API key
    const headToHeadData = await getHeadToHead(homeTeamId, awayTeamId, 10); // Fetch last 10
    const matches: Match[] = headToHeadData?.matches || [];

    // Calculate prediction
    const prediction =
      matches.length > 0 ? calculateMatchPrediction(matches) : null;

    // Return the result
    return NextResponse.json({ matches, prediction });
  } catch (error: unknown) {
    console.error(
      `API Route Error fetching prediction for ${homeTeamId} vs ${awayTeamId}:`,
      error
    );
    // Don't expose detailed internal errors to the client
    return NextResponse.json(
      { error: "Failed to fetch prediction data." },
      { status: 500 }
    );
  }
}
