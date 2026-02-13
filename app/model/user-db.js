import { docClient } from "./dynamodb";
import { PutCommand, GetCommand, QueryCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from 'uuid';

const USERS_TABLE = "Users";

// NEW: Uses the GSI to look up by email
export async function getUserByEmail(email) {
  try {
    const { Items } = await docClient.send(new QueryCommand({
      TableName: USERS_TABLE,
      IndexName: "EmailIndex",
      KeyConditionExpression: "user_email = :email",
      ExpressionAttributeValues: { ":email": email },
    }));
    return Items[0] || null;
  } catch (error) {
    console.error("Error fetching user:", error);
    return null;
  }
}

// NEW: Look up by ID (The Primary Key)
export async function getUserById(userId) {
  try {
    const { Item } = await docClient.send(new GetCommand({
      TableName: USERS_TABLE,
      Key: { user_id: userId }
    }));
    return Item;
  } catch (error) {
    console.error("Error fetching user by ID:", error);
    return null;
  }
}

export async function createUser(userData) {
  let hashedPassword = null;
  if (userData.password) {
    hashedPassword = await bcrypt.hash(userData.password, 10);
  }

  const newUserId = uuidv4();

  const params = {
    TableName: USERS_TABLE,
    Item: {
      user_id: newUserId,     // NEW PK
      user_name: userData.name,
      user_email: userData.email, // Stored for Index
      password: hashedPassword,
      isSuperAdmin: false,
      plan: "none",
      authProvider: userData.authProvider || "email",
      createdAt: new Date().toISOString(),
    },
  };

  try {
    await docClient.send(new PutCommand(params));
    return { success: true, userId: newUserId };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function updateUserPlan(userId, planId) {
  try {
    await docClient.send(new UpdateCommand({
      TableName: USERS_TABLE,
      Key: { user_id: userId },
      UpdateExpression: "set #p = :plan",
      ExpressionAttributeNames: { "#p": "plan" },
      ExpressionAttributeValues: { ":plan": planId }
    }));
    return { success: true };
  } catch (error) {
    console.error("Error updating user plan:", error);
    return { success: false, error: error.message };
  }
}