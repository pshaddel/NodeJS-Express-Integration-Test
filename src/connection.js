const MongoClient = require('mongodb').MongoClient;
const { MongoMemoryServer } = require('mongodb-memory-server');

const getDB = (url) => {
    return new Promise((resolve, reject) => {
        try {
            MongoClient.connect(url, function (err, client) {
                console.log("Connected successfully to server");
                const db = client.db('myproject');
                resolve(db);
            });
        } catch (error) {
            reject(error);
        }
    })
}

const getTestDataBaseURL = async () => {
    const mongod = new MongoMemoryServer({
        instance: {
            dbName: 'myproject'
        }
    });
    return mongod.getUri();
}

let URL = null;
module.exports = async () => {
    const DBurl = 'mongodb://localhost:27017';
    if (process.env.NODE_ENV === 'test') {
        if (!URL) {
            const uri = await getTestDataBaseURL();
            URL = uri;
            return getDB(uri);
        }
        else {
            return getDB(URL)
        }
    } else {
        return getDB(DBurl)
    }
}
