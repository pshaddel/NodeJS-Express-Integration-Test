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