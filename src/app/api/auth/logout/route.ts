import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const db = await createClient();
    await db.auth.signOut({ scope: 'local' });
    
    const response = NextResponse.json({ message: 'Logged out successfully' });
    
    response.cookies.delete('sb-access-token');
    response.cookies.delete('sb-refresh-token');
    
    return response;
  } catch (error) {
    return NextResponse.json({ error: 'Failed to log out' }, { status: 500 });
  }
}