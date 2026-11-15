import { createChatHandler } from "@/lib/chat/handler";

// POST /api/chat — ChemBot (Gemini first, Groq fallback). Logic and limits live in lib/chat/.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const handler = createChatHandler();

export const POST = handler.POST;
export const GET = handler.methodNotAllowed;
export const PUT = handler.methodNotAllowed;
export const PATCH = handler.methodNotAllowed;
export const DELETE = handler.methodNotAllowed;
