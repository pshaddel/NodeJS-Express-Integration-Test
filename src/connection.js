const MongoClient = require('mongodb').MongoClient;
const { MongoMemoryServer } = require('mongodb-memory-server');

// Connection URL
const url = 'mongodb://localhost:27017';

// Database Name
const dbName = 'myproject';

// Use connect method to connect to the server
module.exports = () => {
    return new Promise((resolve, reject) => {
        try {
            MongoClient.connect(url, function (err, client) {
                console.log("Connected successfully to server");
                const db = client.db(dbName);
                resolve(db);
            });
        } catch (error) {
            reject(error);
        }
    })
}

const mongod = new MongoMemoryServer({
    instance: {
        port: 27020, // by default choose any free port
        dbName: 'myproject', // by default generate random dbName
    }
});