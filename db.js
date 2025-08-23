const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  ScanCommand,
  UpdateCommand,
  DeleteCommand
} = require('@aws-sdk/lib-dynamodb');

const TABLE_NAME = process.env.DDB_TABLE || 'Items';
const REGION = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-1';

const ddb = new DynamoDBClient({ region: REGION });
const doc = DynamoDBDocumentClient.from(ddb, {
  marshallOptions: { removeUndefinedValues: true, convertEmptyValues: true }
});

async function listItems() {
  const out = await doc.send(new ScanCommand({ TableName: TABLE_NAME }));
  return out.Items || [];
}

async function getItem(id) {
  const out = await doc.send(new GetCommand({ TableName: TABLE_NAME, Key: { id } }));
  return out.Item || null;
}

async function createItem(item) {
  await doc.send(new PutCommand({ TableName: TABLE_NAME, Item: item }));
  return true;
}

async function updateStock(id, { delta, quantity }) {
  if (typeof delta === 'number') {
    const out = await doc.send(new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { id },
      UpdateExpression: 'SET quantity = if_not_exists(quantity, :zero) + :d, updatedAt = :u',
      ConditionExpression: 'attribute_exists(id)',
      ExpressionAttributeValues: {
        ':d': delta,
        ':zero': 0,
        ':u': new Date().toISOString()
      },
      ReturnValues: 'ALL_NEW'
    }));
    return out.Attributes || null;
  } else if (typeof quantity === 'number') {
    const out = await doc.send(new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { id },
      UpdateExpression: 'SET quantity = :q, updatedAt = :u',
      ConditionExpression: 'attribute_exists(id)',
      ExpressionAttributeValues: {
        ':q': quantity,
        ':u': new Date().toISOString()
      },
      ReturnValues: 'ALL_NEW'
    }));
    return out.Attributes || null;
  }
  throw new Error('Provide delta or quantity');
}

async function deleteItem(id) {
  try {
    await doc.send(new DeleteCommand({
      TableName: TABLE_NAME,
      Key: { id },
      ConditionExpression: 'attribute_exists(id)'
    }));
    return true;
  } catch (e) {
    if (e && e.name === 'ConditionalCheckFailedException') return false;
    throw e;
  }
}

module.exports = { listItems, getItem, createItem, updateStock, deleteItem };