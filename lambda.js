const serverlessExpress = require('@vendia/serverless-express');
const app = require('./app');

// Exported Lambda handler
exports.handler = serverlessExpress({ app });