const express = require('express')
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const app = express();

// Middle Wares
app.use(cors()); // For Get Method
app.use(express.json()); // For Post Method
// knowledgeDB

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.f12gj4o.mongodb.net/?retryWrites=true&w=majority`
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

// JWT Verification
function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: 'unauthorized access' });
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'Forbidden access' });
        }
        req.decoded = decoded;
        next();
    })
}

async function run() {
    try {
        const knowledgeCollection = client.db("knowledge").collection("services");
        const reviewCollection = client.db("knowledge").collection("review");

        // All Service api
        app.get('/services', async (req, res) => {
            const query = {};
            const cursor = knowledgeCollection.find(query);
            const result = await cursor.toArray();
            res.send(result)
        })

        // JWT TOKEN  API
        app.post('/jwt', (req, res) => {
            const user = req.body;
            // console.log(user);
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '7d' });
            res.send({ token });
        })

        // Home limit 3 API
        app.get('/homeServices', async (req, res) => {
            const query = {};
            const options = {
                sort: { _id: -1 }
            };
            const cursor = knowledgeCollection.find(query, options);
            const result = await cursor.limit(3).toArray();
            res.send(result)
        })

        // Home add new service
        app.post('/homeServices', async (req, res) => {
            const allService = req.body;
            const result = await knowledgeCollection.insertOne(allService);
            res.send(result);
        })

        // Dynamic api
        app.get('/service/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await knowledgeCollection.findOne(query);
            res.send(result)
        })

        // Post Method
        // Insert Method
        app.post('/reviews', verifyJWT, async (req, res) => {
            const review = req.body;
            const result = await reviewCollection.insertOne(review);
            res.send(result);
        })

        // All review api data
        app.get('/reviews', async (req, res) => {
            const query = {}
            const options = {
                // sort returned documents in ascending order by date (A->Z)
                sort: { date: -1 }
            };
            const cursor = reviewCollection.find(query, options);
            const result = await cursor.toArray();
            res.send(result);
        })

        // Current user api data
        app.get('/currentReview', async (req, res) => {
            const query = {};
            const cursor = reviewCollection.find(query);
            const result = await cursor.toArray();
            res.send(result);
        })

        // Delete
        app.delete('/reviews/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await reviewCollection.deleteOne(query);
            res.send(result)
        })

        // Update
        app.patch('/reviews/:id', async (req, res) => {
            const id = req.params.id;
            const status = req.body.status;
            const query = { _id: ObjectId(id) };
            const updatedDoc = {
                $set: {
                    status: status
                }
            }
            const result = await reviewCollection.updateOne(query, updatedDoc);
            res.send(result);
        })

    }
    finally {
        // await client.close();
    }
}
run().catch(console.dir);

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})