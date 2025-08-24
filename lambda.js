// lambda.js
const serverlessExpress = require('@vendia/serverless-express');
const app = require('./app'); // exports the Express app (no app.listen)

let cached; // reuse between invocations
exports.handler = async (event, context) => {
  if (!cached) cached = serverlessExpress({ app });
  return cached(event, context);
};
