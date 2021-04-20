Read the whole article [here](https://medium.com/weekly-webtips/nodejs-express-integration-test-3e79edb1ae6b) in medium.

# Testing NodeJS Express App

## What is an integration test?

“ Integration tests determine if independently developed units of software work correctly when they are connected to each other. The term has become blurred even by the diffuse standards of the software industry, so I’ve been wary of using it in my writing. In particular, many people assume integration tests are necessarily broad in scope, while they can be more effectively done with a narrower scope. “ **Martin Fowler.**

## Testing an Express app

So as to see how we can test an [**Express**](https://www.npmjs.com/package/express) app we need to create a simple Express application. I used [**MongoDB**](https://www.mongodb.com/) and its [**native driver**](https://www.npmjs.com/package/mongodb)(We usually use [**Mongoose**](https://www.npmjs.com/package/mongoose) as an ODM) but in order to keep it as simple as possible I didn’t use Mongoose also, I implemented users directly in `app.js` which is not a good practice but it helps us to focus on how tests are working. You can take a look at [this repository](https://github.com/pshaddel/NodeJS-Express-TS-Prisma) to see a better boilerplate for your NodeJS app.

## Installing packages

_express_: we need express to implement our routes.  
_jest_: Jest is our testing framework and it gives us a test environment.  
_supertest_: we use Supertest for making requests.  
_mongodb_: It is MongoDB native driver(For simplicity we are not using an ODM)._  
mongodb-memory-server_: This is an in-memory mongodb database and we are going to use it to run our tests.

```JSON
{
  "name": "nodejs-express-integration-test",
  "version": "1.0.0",
  "description": "A simple project which shows a simple express app and how we can test      it.",
  "main": "index.js",
  "scripts": {
    "test": "jest --force-exit"
  },
  "repository": {
    "type": "git",
    "url": "git+https://github.com/pshaddel/NodeJS-Express-Integration-Test.git"
  },
"keywords": ["express"],
"author": "Poorshad Shaddel",
"license": "ISC",
"bugs": { "url": "https://github.com/pshaddel/NodeJS-Express-Integration-Test/issues" },
"homepage": "https://github.com/pshaddel/NodeJS-Express-Integration-Test#readme",
"dependencies": {
  "express": "^4.17.1",
  "jest": "^26.4.2",
  "mongodb": "^3.6.2",
  "supertest": "^5.0.0"
  },
"devDependencies": {
  "mongodb-memory-server": "^6.9.0"
  }
}
```
package.json

## Create a Jest config file

Jest needs a `jest.config.js` file to find our test files.

```javascript
module.exports = {
  roots: ['<rootDir>/src'],
  testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.js?$',
  moduleFileExtensions: ['js', 'json', 'node'],
};
```

* My project express app files are inside `src` folder so in line 2 I used `<rootDir>/src`  
* In line 3 we need to enter a regex to separate test files from source files. This Regex returns true when the file has `test.js` or `spec.js` extensions or it is under `__test__` folder(Jest recommends putting tests in this folder).

## Create an Express app
```javascript
const express = require('express');

const app = express();

const bodyParser = require('body-parser');

app.use(express.json());

app.use(express.urlencoded({ extended: false }));

app.use(bodyParser.urlencoded({ extended: true }));

app.use(bodyParser.json());

app.listen(3000, () => {

console.info("app is listening on port 3000");

});

module.exports = { app }
```

This is a simple express app and the body-parser is used to handle the body of post requests.

## Create a database connection

We need two kinds of the database :

-   **Permanent database**: It can be a docker container or mongodb cloud or a service on your local machine which persists data of the application.
-   **Test database**: Usually people use a temporary database which is fast so we can run our tests faster. We can use an in-memory version of mongodb using packages(we use this way in this example because it is easier :) ) or we can use a docker.

_How do we know that we are testing?  
_By using environment variables. When we run tests using Jest this variable is `process.env.NODE_ENV` equal to `test`.

So when we are in development or production mode we can use a permanent database and in test mode, we need to use another database.

So let’s create a simple connection file :
```javascript
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
  instance: {  dbName: 'myproject' }
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
  else { return getDB(URL) }
} else { return getDB(DBurl) }
```
creating a database connection

Now we are going to scrutiny this file line by line.

**_getDB function(4–16)_**: This function gets an instance of the database connection(The better practice of getting an instance of connection is using a Singular pattern you can see one way of implementing this pattern in [this article](https://medium.com/weekly-webtips/javascript-closure-in-plain-language-and-one-practical-real-world-example-d0dab81c4a05?source=your_stories_page-------------------------------------)).  
**_getTestDataBaseURL function(18–25)_**: In order to run tests we need an in-memory database and we are going to use `mongodb-memory-server` npm package. This package creates a mongodb database on a random free port(you can use a static port by passing options to your instance). When we are creating an instance by calling its constructor we can use `getUri` function to get the database URL. this promise returns a URL like this : `mongodb://localhost:27021`  
**_module.exports(27–42)_**: We want to use an in-memory database when we are testing so we can use a condition an check the value of `process.env.NODE_ENV` .

_Why we used the condition line 31?_ `_if (!URL){}_`Each time we create an instance of `MongodbMemoryServer` there is a new raw database and by checking the URL value I don’t want to create a new instance of `MongodbMemoryServer` , the first time I create an instance I change the URL variable so next time I use that URL instead of creating a new mongodb in-memory database.

## Find users and insert user
```javascript
app.get('/users', async (req, res) => {
    const db = await getDB();
    const users = await db.collection('users').find().toArray();
    res.json({ users })
});

app.post('/users', async (req, res) => {
    const { name, email } = req.body;
    const db = await getDB();
    const insertResult = await db.collection('users').insertOne({
        name, email
    });
    res.json(insertResult)
})
```
Getting users and insert one user

We implemented these routes inside `app.js` .

## Test!

Finally, we are ready to implement our tests.
```javascript
const { app } = require('./app');
const request = require('supertest');

describe("Get Users", () => {
    it('get users should be an empty array', async () => {
        const res = await request(app).get('/users');
        expect(res.body).toHaveProperty('users');
        expect(res.body.users).toEqual([]);
        expect(res.status).toBe(200);
    });
    it('get users after inserting one user should be an array with one element', async () => {
        const insertedResult = await request(app).post('/users').send({ name: "Amin", email: "amin@gmail.com" });
        const res = await request(app).get('/users');
        expect(res.body.users.length).toBe(1);
        expect(res.body.users[0].name).toBe("Amin")
        expect(res.status).toBe(200);
    })
})

describe("Insert User", () => {
    it('insert users should result in one inserted document', async () => {
        const res = await request(app).post('/users').send({ name: "Poorshad", email: "p.shaddel@gmail.com" });
        expect(res.body.insertedCount).toBe(1);
        expect(res.body.ops[0].name).toBe("Poorshad");
        expect(res.body.ops[0].email).toBe("p.shaddel@gmail.com");
        expect(res.status).toBe(200);
    });
});
```
An imperative point is that we need to import our express instance here.  
By using `supertest` package we can make requests.  
this is the way we can make a request using `supertest`:

const res = await request(app).get('/users');

Since the database is empty we expect users to be `[]` .

In the second test, we are inserting a user and we are getting users so we expect the users to be an array with one element.

In the last test, we are inserting a user and we expect the response to have properties like `insertedCount` .
