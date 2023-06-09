const express = require("express");
const app = express();
const cors = require("cors");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const data = require("./data.json");

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.dp2hutp.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});
const userCollection = client.db("golden-tunes").collection("users");
const classCollection = client.db("golden-tunes").collection("class");
const classesCollection = client.db("golden-tunes").collection("classes");

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

const verifyJWT = (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res.status(401).send({ error: true, message: "Token Not Found" });
  }
  const token = authorization.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN, (err, decoded) => {
    if (err) {
      return res.status(401).send({ error: true, message: "Token Mismatch" });
    }
    req.decoded = decoded;
    next();
  });
};

// jwt token
app.post("/jwt", (req, res) => {
  const user = req.body;

  const token = jwt.sign(user, process.env.ACCESS_TOKEN, {
    expiresIn: 3600,
  });
  res.send({ token });
});

// verifying admin
const verifyAdmin = async (req, res, next) => {
  const email = req.decoded.email;
  const query = { email: email };
  const user = await userCollection.findOne(query);
  if (user?.role !== "admin") {
    return res.status(403).send({ error: true, message: "Not Admin" });
  }
  next();
};
// checking if the server is running
app.get("/", (req, res) => {
  res.send("finely tuned");
});
// sending demo class data , TODO : from DB
app.get("/classes", async (req, res) => {
  const result = await classCollection
    .find({ totalEnrolledStudents: { $exists: true } })
    .sort({ totalEnrolledStudents: -1 })
    .limit(6)
    .toArray();

  res.send(result);
});
// checking user role
app.get("/users/admin/:email", async (req, res) => {
  const query = { email: req?.params?.email };

  const user = await userCollection.findOne(query);
  const result = { role: user.role };

  res.send(result);
});
// update role to instructor
app.post("/users/instructor/:id", async (req, res) => {
  const filter = { _id: new ObjectId(req?.params?.id) };

  const updatedDoc = {
    $set: {
      role: "instructor",
    },
  };
  const result = await userCollection.updateOne(filter, updatedDoc);
  res.send(result);
});
// getting all the users
app.get("/users", verifyJWT, async (req, res) => {
  const result = await userCollection.find().toArray();
  res.send(result);
});
// storing user while registering
app.post("/users", async (req, res) => {
  const user = req.body;
  const query = { email: user.email };
  const existingUser = await userCollection.findOne(query);
  if (existingUser) {
    return;
  } else {
    const result = await userCollection.insertOne(user);
    res.send(result);
  }
});

// add a class API
app.post("/add-class", async (req, res) => {
  const classInfo = req.body;
  const result = await classCollection.insertOne(classInfo);
  res.send(result);
});
// instructor class API
app.get("/my-classes/instructor/:email", async (req, res) => {
  const query = { instructorEmail: req?.params?.email };
  const result = await classCollection.find(query).toArray();
  res.send(result);
});
app.listen(port, () => {
  console.log(`tuned at ${port}`);
});
