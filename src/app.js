const express = require('express');
const app = express();;
const bodyParser = require('body-parser');
const getDB = require('./connection');

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

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

app.listen(3000, () => {
    console.info("app is listening on port 3000");
});

module.exports = { app }