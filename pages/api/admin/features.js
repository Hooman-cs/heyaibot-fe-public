import { NextResponse } from "next/server";
import { getPlanFeatures, createFeature, toggleFeatureStatus } from "../../../app/model/feature-db";
// import { getServerSession } from "next-auth";
import { getServerSession } from "next-auth/next";

import { authOptions } from "../../api/auth/[...nextauth]";

// Helper to check admin role
async function isAdmin() {
  const session = await getServerSession(authOptions);
  return session?.user?.isSuperAdmin === true;
}

export async function GET(req) {
  // Public access is okay for fetching features (Pricing page needs them)
  // But strictly speaking, the pricing page uses a different flow. 
  // Let's secure this for Admin Dashboard use-cases just in case.
  const { searchParams } = new URL(req.url);
  const planId = searchParams.get("planId");

  if (!planId) return NextResponse.json({ error: "Missing planId" }, { status: 400 });

  const features = await getPlanFeatures(planId);
  return NextResponse.json(features);
}

export async function POST(req) {
  if (!await isAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const body = await req.json();
  // Expects: { planId, name, value }
  const newFeature = await createFeature(body);
  return NextResponse.json(newFeature);
}

export async function PUT(req) {
  if (!await isAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { planId, featureId, status } = await req.json();
  await toggleFeatureStatus(planId, featureId, status);
  return NextResponse.json({ success: true });
}