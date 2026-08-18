import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import NotificationLog from "@/models/NotificationLog";

export async function GET() {
  try {
    await dbConnect();
    const logs = await NotificationLog.find({}).sort({ sentAt: -1 }).limit(50);
    return NextResponse.json({ success: true, logs });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
