import { docClient } from "./dynamodb";
import { QueryCommand, PutCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from 'uuid';

const FEATURES_TABLE = "Features";

// Get all features for a plan
export async function getPlanFeatures(planId) {
  const result = await docClient.send(new QueryCommand({
    TableName: FEATURES_TABLE,
    KeyConditionExpression: "plan_id = :pid",
    ExpressionAttributeValues: { ":pid": planId }
  }));
  return result.Items || [];
}

export async function createFeature(featureData) {
  const featureId = uuidv4();
  
  const item = {
    plan_id: featureData.planId, // PK
    feature_id: featureId,       // SK
    feature_name: featureData.name,
    feature_value: featureData.value,
    status: "enable" // Default
  };

  await docClient.send(new PutCommand({
    TableName: FEATURES_TABLE,
    Item: item
  }));
  return item;
}

export async function toggleFeatureStatus(planId, featureId, status) {
  await docClient.send(new UpdateCommand({
    TableName: FEATURES_TABLE,
    Key: { plan_id: planId, feature_id: featureId },
    UpdateExpression: "set #s = :status",
    ExpressionAttributeNames: { "#s": "status" },
    ExpressionAttributeValues: { ":status": status }
  }));
}