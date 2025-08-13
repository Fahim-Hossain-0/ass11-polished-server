const express = require("express");
const cors = require("cors");
require("dotenv").config(); // ✅ Load environment variables

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Test Route
app.get("/", (req, res) => {
  res.send("Server is running");
});



const admin = require("firebase-admin");

const serviceAccount = require("./food-hub-admin.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});


// verify access token
// const verifyFirebaseToken = async (req, res, next) => {
//     const authHeader = req.headers?.authorization;

//     if (!authHeader || !authHeader.startsWith("Bearer ")) {
//         return res.status(401).send({ message: "unauthorized access" });
//     }

//     const token = authHeader.split(" ")[1];

//     try {
//         const decoded = await admin.auth().verifyIdToken(token);
//         console.log("decoded token", decoded);
//         req.decoded = decoded;
//         next();
//     } catch (error) {
//         return res.status(401).send({ message: "unauthorized access" });
//     }
// };


// const verifyTokenEmail = (req, res, next) => {
//     if (req.params.email !== req.decoded.email) {
//         return res.status(403).send({ message: "forbidden access" });
//     }
//     next();
// };








// mongoDB


const verifyFirebaseToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized: No token provided' });
  }

  const idToken = authHeader.split(' ')[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.firebaseUser = decodedToken; // You can access user info like uid, email, etc.
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Unauthorized: Invalid token from catch' });
  }
};

const verifyTokenEmail = (req, res, next) => {
    const queryEmail = req.query.email;
    const tokenEmail = req.decoded?.email;

    if (queryEmail !== tokenEmail) {
        return res.status(403).send({ message: "forbidden access" });
    }
    next();
};


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const uri = `mongodb+srv://${process.env.MONGODB_USER}:${process.env.MONGODB_PASS}@hobby.iroaics.mongodb.net/?retryWrites=true&w=majority&appName=hobby`;

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

    const foodCollection = client.db('Foods-Collection').collection('my-food')

   

//   app.get('/foods', async (req, res) => {
//   const sortOrder = req.query.sort === 'desc' ? -1 : 1;
//   const showAvailable = req.query.available === 'true';
//   const now = new Date();

//   const query = showAvailable
//     ? { status: 'available', expireDate: { $gt: now } }
//     : {};

//   try {
//     const result = await foodCollection
//       .find(query)
//       .sort({ addedAt: -1, expireDate: sortOrder })  // Chain sort here
//       .toArray();

//     res.send(result);
//   } catch (error) {
//     console.error(error);
//     res.status(500).send({ error: 'Failed to fetch foods' });
//   }
// });

app.get('/foods', async (req, res) => {
  const email = req.query.email;
  const sortOrder = req.query.sort === 'desc' ? -1 : 1;
  const showAvailable = req.query.available === 'true';
  const now = new Date();

  let query = {};

  
  if (showAvailable) {
    query = { status: 'available', expireDate: { $gt: now } };
  }


 if (email) {
  query = { donorEmail: email };
}


  try {
    const result = await foodCollection
      .find(query)
      .sort({ addedAt: -1, expireDate: sortOrder })
      .toArray();

    res.send(result);
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'Failed to fetch foods' });
  }
});


    app.get('/foods/:id', async (req, res) => {
      const id = req.params.id
      const query = { _id: new ObjectId(id) }
      const result = await foodCollection.findOne(query)
      res.send(result)
    })

  

 app.get("/requested-foods", async (req, res) => {
  try {
    const email = req.query.email;

    if (!email) {
      return res.status(400).json({ error: "Email query is required" });
    }

    const requestedFoods = await foodCollection
      .find({ status: "requested", requesterEmail: email }) // requesterEmail must be in your DB
      .toArray();

    res.json(requestedFoods);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch requested foods" });
  }
});





    app.post('/foods', async (req, res) => {
      const newFood = req.body
      const result = await foodCollection.insertOne(newFood)
      res.send(result)
      console.log(result, 'food data');
    })


    app.patch("/request-food/:id", async (req, res) => {
  const { id } = req.params;
  const { requesterEmail } = req.body;

  if (!requesterEmail) {
    return res.status(400).json({ error: "requesterEmail is required" });
  }

  try {
    const result = await foodCollection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          status: "requested",
          requesterEmail: requesterEmail,  // ✅ Save logged-in user's email
          addedAt: new Date()              // Optional: Save request time
        }
      }
    );

    res.send(result);
  } catch (err) {
    res.status(500).json({ error: "Request failed" });
  }
});


     app.put('/foods/:id', async(req,res)=>{
      const id = req.params.id
      const filter = {_id: new ObjectId(id)}
      const options = {upsert : true}
      const updatedFood = req.body
      const updatedDoc = {
        $set: updatedFood
      } 
      const result = await foodCollection.updateOne(filter,updatedDoc,options)
      res.send(result)
    })

    app.delete('/foods/:id', async(req,res)=>{
      const id = req.params.id
      const query = { _id: new ObjectId(id)}
      const result = await foodCollection.deleteOne(query)
      res.send(result)
    })









    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    // console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);














// Start Server
app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
