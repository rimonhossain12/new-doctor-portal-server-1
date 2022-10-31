const express = require('express');
const { MongoClient, ServerApiVersion } = require('mongodb');
const cors = require('cors');
const port = process.env.PORT || 5000;
require('dotenv').config();

// mongo connection
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.l6guwec.mongodb.net/?retryWrites=true&w=majority`;
// mongo client
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

// middleware
const app = express();
app.use(express.json());
// app.use(express.urlencoded({ extended: true }));
app.use(cors());


async function run() {
    try {
        await client.connect();
        const serviceCollections = client.db('doctors_portal-1').collection('services');

        app.get('/services', async (req, res) => {
            const query = {};
            const cursor = serviceCollections.find(query);
            const service = await cursor.toArray();
            res.send(service)
        })

    }
    finally {

    }
}

run().catch(console.dir)

app.get('/', (req, res) => {
    res.send('Doctor portal server Running!');
})

app.listen(port, () => {
    console.log(`Running on port ${port}`)
})