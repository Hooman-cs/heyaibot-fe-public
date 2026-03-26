import { docClient } from "./dynamodb";
import { GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";

const WALLET_TABLE = "TokenWallets";

// 1. Check a user's current booster balance
export async function getWalletBalance(userId) {
  try {
    const { Item } = await docClient.send(new GetCommand({
      TableName: WALLET_TABLE,
      Key: { user_id: userId }
    }));
    return Item ? Item.balance : 0;
  } catch (error) {
    console.error("Get Wallet Error:", error);
    return 0;
  }
}

// 2. Add tokens when they buy a booster pack (Atomic operation!)
export async function addTokensToWallet(userId, tokenAmount) {
  try {
    await docClient.send(new UpdateCommand({
      TableName: WALLET_TABLE,
      Key: { user_id: userId },
      // "ADD" automatically creates the record if it doesn't exist, or adds to it if it does!
      UpdateExpression: "ADD balance :val SET last_updated = :date",
      ExpressionAttributeValues: {
        ":val": Number(tokenAmount),
        ":date": new Date().toISOString()
      },
      ReturnValues: "UPDATED_NEW"
    }));
    return { success: true };
  } catch (error) {
    console.error("Add Tokens Error:", error);
    return { success: false, error: error.message };
  }
}

// 3. Deduct tokens when the bot answers a question
export async function deductTokensFromWallet(userId, tokenAmount) {
  try {
    // We use a negative number to subtract
    await docClient.send(new UpdateCommand({
      TableName: WALLET_TABLE,
      Key: { user_id: userId },
      // Condition prevents the wallet from going below zero!
      UpdateExpression: "ADD balance :val SET last_updated = :date",
      ConditionExpression: "balance >= :minRequired", 
      ExpressionAttributeValues: {
        ":val": -Math.abs(Number(tokenAmount)), 
        ":minRequired": Number(tokenAmount),
        ":date": new Date().toISOString()
      },
      ReturnValues: "UPDATED_NEW"
    }));
    return { success: true };
  } catch (error) {
    if (error.name === "ConditionalCheckFailedException") {
      return { success: false, error: "Insufficient booster tokens" };
    }
    return { success: false, error: error.message };
  }
}