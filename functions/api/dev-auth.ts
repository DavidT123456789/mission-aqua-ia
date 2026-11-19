import { DEV_ANSWERS } from "../../shared/devAnswers";

function timingSafeStringEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export async function onRequestPost({ request, env }: { request: Request; env: Record<string, string | undefined> }) {
  try {
    const expectedPassword = env.DEV_PASSWORD?.trim() || "dev123";

    const body = await request.json() as { password?: unknown };
    const { password } = body || {};

    if (typeof password !== "string" || !timingSafeStringEqual(password, expectedPassword)) {
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
