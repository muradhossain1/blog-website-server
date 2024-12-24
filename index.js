const express = require('express')
const cors = require('cors')
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const port = process.env.PORT || 5000
const app = express();

app.use(cors())
app.use(express.json())

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.vy1ux.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();
        // Send a ping to confirm a successful connection

        const blogsCollection = client.db('blogsDB').collection('blogs')

        //add blogs
        app.post('/blogs', async (req, res) => {
            const newblogs = req.body;
            const result = await blogsCollection.insertOne(newblogs)
            res.send(result)
        });

        // get all data add blogs
        app.get('/all-blogs', async (req, res) => {
            const filter = req.query.filter;
            const search = req.query.search;

            let query = {}
            //filter query
            if (filter) {
                query.category = filter
            }
            // search query
            if (search) {
                query = {
                    title: {
                        $regex: search,
                        $options: 'i',
                    }
                }
            }
            const result = await blogsCollection.find(query).toArray();
            res.send(result);
        })

        //get recent blogs section data limited
        app.get('/recent-blogs', async (req, res) => {
            const result = await blogsCollection.find().limit(6).toArray();
            res.send(result);
        })

        // get a details single data by id from db 
        app.get('/blog/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await blogsCollection.findOne(query);
            res.send(result);
        })



        // await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);



app.get('/', (req, res) => {
    res.send('Running from assignment 11 project  Server....')
})

app.listen(port, () => {
    console.log(`Server running on port ${port}`)
})