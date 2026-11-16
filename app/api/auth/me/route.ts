import { NextResponse } from "next/server";
import { getStudentSession } from "@/lib/auth-session";
import { User, ensureDbSynced } from "@/lib/db";

export async function GET() {
  try {
    await ensureDbSynced();

    const payload = await getStudentSession();
    if (!payload || !payload.id) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    // Fetch user details from MySQL to verify they exist and are current
    const dbUser = await User.findByPk(payload.id);
    if (!dbUser) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    // Safely extract properties
    const userId = dbUser.get("id");
    const userEmail = dbUser.get("email");
    const userName = dbUser.get("name");
    const userCreatedAt = dbUser.get("createdAt");

    // Strict Role Policy: Only student accounts are valid for the Student Website
    if (dbUser.role !== "student" || dbUser.status !== "active") {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    return NextResponse.json({
      user: {
        id: userId ? userId.toString() : "",
        email: userEmail || "",
        name: userName || "",
        institution: (dbUser as any).institution || "",
        role: "student",
        status: (dbUser as any).status || "active",
        createdAt: userCreatedAt ? new Date(userCreatedAt).toISOString() : new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error("Me API error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
