import { createUser, getUserByEmail } from "../../app/model/user-db";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json({ message: "Missing fields" }, { status: 400 });
    }

    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return NextResponse.json({ message: "User already exists" }, { status: 400 });
    }

    const result = await createUser({ name, email, password });
    console.log("Create User Result:", result, name, email, password);
    if (!result.success) throw new Error(result.error);

    return NextResponse.json({ message: "User registered" }, { status: 201 });
  } catch (error) {
    console.error("Registration Error:", error);
    return NextResponse.json({ message: "Error creating user" }, { status: 500 });
  }
}