import { DEV_ANSWERS } from "../../shared/devAnswers";

export async function onRequestPost({ request, env }: { request: Request; env: Record<string, string | undefined> }) {
  try {
    const body = await request.json();
    const { password } = body || {};

    const expectedPassword = env.DEV_PASSWORD || "dev123";

    if (typeof password !== "string" || password !== expectedPassword) {
      return new Response(JSON.stringify({ error: "Mot de passe incorrect." }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }

    return new Response(JSON.stringify({ answers: DEV_ANSWERS }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch {
    return new Response(JSON.stringify({ error: "Requête invalide." }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }
}
