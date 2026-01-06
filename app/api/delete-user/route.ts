import { NextResponse } from 'next/server';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin (Runs on Server Only)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

export async function POST(request: Request) {
  try {
    const { uid } = await request.json();
    if (!uid) return NextResponse.json({ error: "User UID is required" }, { status: 400 });

    // Delete from Authentication (The "God Mode" part)
    await admin.auth().deleteUser(uid);

    return NextResponse.json({ success: true, message: "User deleted from Auth" });
  } catch (error: any) {
    console.error("Delete Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}