/**
 * Test database. By default an in-memory MongoDB is started, so tests never touch
 * real data. Set TEST_MONGO_URI to use an existing server instead (e.g. in CI).
 */
const mongoose = require('mongoose');

let mongod;

exports.connect = async () => {
  let uri = process.env.TEST_MONGO_URI;
  if (!uri) {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    mongod = await MongoMemoryServer.create();
    uri = mongod.getUri();
  }
  await mongoose.connect(uri);
};

exports.clear = async () => {
  await Promise.all(Object.values(mongoose.connection.collections).map((c) => c.deleteMany({})));
};

exports.close = async () => {
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
};
