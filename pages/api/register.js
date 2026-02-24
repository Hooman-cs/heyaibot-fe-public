import { createUser, getUserByEmail } from "../../app/model/user-db"; 

export default async function handler(req, res) {
  // 1. Check for POST method
  if (req.method !== 'POST') {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    // 2. Get Data (In Pages Router, req.body is already parsed)
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Missing fields" });
    }

    // 3. Check if User Exists
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // 4. Create User
    const result = await createUser({ name, email, password });
    
    if (!result.success) {
      throw new Error(result.error);
    }

    // 5. Success Response
    return res.status(201).json({ message: "User registered successfully" });

  } catch (error) {
    console.error("Registration Error:", error);
    return res.status(500).json({ message: "Error creating user" });
  }
}