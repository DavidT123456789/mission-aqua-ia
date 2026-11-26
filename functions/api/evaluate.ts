import { evaluateStudentIdea, validateIdeaInput } from "../../shared/evaluateIdea";

export async function onRequestPost({
  request,
  env,
}: {
  request: Request;
  env: Record<string, string | undefined>;
}) {
  try {
    const body = (await request.json()) as { idea?: unknown };
    const validation = validateIdeaInput(body?.idea);
    if (validation.ok === false) {
      return new Response(JSON.stringify({ error: validation.error }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const apiKey = env.GEMINI_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Clé API manquante" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const data = await evaluateStudentIdea(apiKey, validation.idea);
    return new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error(error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Erreur lors de l'analyse",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
