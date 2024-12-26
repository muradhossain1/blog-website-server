const express = require('express')
const cors = require('cors')
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser')

const port = process.env.PORT || 5000
const app = express();

const corsOption = {
    origin: [
        'http://localhost:5173',
        'https://my-assignment-11-73142.web.app',
        'https://my-assignment-11-73142.firebaseapp.com'],
    credentials: true,
    optionalSuccessStatus: 200,
}

app.use(cors(corsOption))
app.use(express.json())
app.use(cookieParser())

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.vy1ux.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

const verifyToken = (req, res, next) => {
    const token = req.cookies?.token
    console.log(token)
    if (!token) {
        return res.status(401).send({ message: 'Unauthorized access' })
    }
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).send({ message: 'Unauthorized access' })
        }
        req.user = decoded;
    })

    next()
}

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();
        // Send a ping to confirm a successful connection

        const blogsCollection = client.db('blogsDB').collection('blogs')
        const commentsCollection = client.db('blogsDB').collection('comments')
        const wishlistCollection = client.db('blogsDB').collection('wishlists')

        //generate jwt
        app.post('/jwt', async (req, res) => {
            const email = req.body;
            const token = jwt.sign(email, process.env.JWT_SECRET, { expiresIn: '1d' })

            res.cookie('token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict'
            }).send({ success: true })
        })

        // logout cookie token
        app.get('/logout', async (req, res) => {
            res.clearCookie('token', {
                maxAge: 0,
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict'
            }).send({ success: true })
        })

        //add blogs
        app.post('/blogs',verifyToken, async (req, res) => {
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
        app.get('/blog/:id', verifyToken, async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await blogsCollection.findOne(query);
            res.send(result);
        })


        //  post comment data
        app.post('/comments', async (req, res) => {
            const newComment = req.body;
            const result = await commentsCollection.insertOne(newComment)
            res.send(result)
        });

        // update blog
        app.patch('/updates/:id', verifyToken, async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const options = { upsert: true };
            const updatedDoc = {
                $set: req.body
            }
            const result = await blogsCollection.updateOne(filter, updatedDoc, options)
            res.send(result);
        })

        // featured
        app.get('/featured', async (req, res) => {
            // const sort = [{ $sort: { longDescript: -1}}]
            const result = await blogsCollection.find().toArray();
            res.send(result);
        })

        // wishlist
        app.post('/wishlists', async (req, res) => {
            const newWishlist = req.body;
            const result = await wishlistCollection.insertOne(newWishlist)
            res.send(result)
        });

        // query spacific user
        app.get('/wishlist', verifyToken, async (req, res) => {
            const email = req.query.email;

            const decodedEmail = req.user.email;
            if (decodedEmail !== email) {
                return res.status(401).send({ message: 'Unauthorized access' })
            }
            const query = { email: email }
            const result = await wishlistCollection.find(query).toArray()
            res.send(result)
        });

        // remove wishlist
        app.delete('/wishlist/:id',verifyToken, async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await wishlistCollection.deleteOne(query);
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