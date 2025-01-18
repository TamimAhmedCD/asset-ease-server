const express = require("express");
const cors = require("cors");
const app = express();
require("dotenv").config();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.k9pcb.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    //! HR Collection
    const hrAccountCollection = client.db("AssetEase").collection("hr_account");

    //! Employee Collection
    const employeeAccountCollection = client
      .db("AssetEase")
      .collection("employee_account");

    //! Assets Collection
    const assetsCollection = client.db("AssetEase").collection("assets");

    //! HR Account Related API

    // Get HR data using HR email
    app.get("/hr-account/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const result = await hrAccountCollection.findOne(query);
      res.send(result);
    });

    // Post HR data
    app.post("/hr-account", async (req, res) => {
      const account = req.body;
      const query = { email: account.email };
      const existingAccount = await hrAccountCollection.findOne(query);
      if (existingAccount) {
        return res.send({ message: "user already exist", insertedId: null });
      }
      const result = await hrAccountCollection.insertOne(account);
      res.send(result);
    });

    //! Employee Account Related API

    // Get Employee data using Employee email
    app.get("/employee-account/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const result = await employeeAccountCollection.findOne(query);
      res.send(result);
    });

    // Post Employee data
    app.post("/employee-account", async (req, res) => {
      const account = req.body;
      const query = { email: account.email };
      const existingAccount = await employeeAccountCollection.findOne(query);
      if (existingAccount) {
        return res.send({ message: "user already exist", insertedId: null });
      }
      const result = await employeeAccountCollection.insertOne(account);
      res.send(result);
    });

    //! Get all account by email and find only role
    app.get("/user/:email", async (req, res) => {
      const email = req.params.email;

      const user =
        (await hrAccountCollection.findOne({ email: email })) ||
        (await employeeAccountCollection.findOne({ email: email }));

      if (user) {
        res.json({ role: user.role });
      } else {
        res.status(404).json({ message: "User not found" });
      }
    });

    //! Get all Users account
    app.get("/user", async (req, res) => {
      try {
        // Fetch data from both collections in parallel
        const [hrData, employeeData] = await Promise.all([
          hrAccountCollection.find().toArray(),
          employeeAccountCollection.find().toArray(),
        ]);

        // Combine the data from both collections
        const result = {
          hr: hrData,
          employees: employeeData,
        };

        res.send(result); // Send the combined data
      } catch (error) {
        console.error("Error fetching HR and Employee data:", error);
        res.status(500).send({ message: "Failed to fetch data" });
      }
    });

    //! Assets Related APi

    // Post Assets data
    app.post('/assets', async(req, res) => {
      const asset = req.body;
      const result = await assetsCollection.insertOne(asset)
      res.send(result)
    })

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

app.get("/", (req, res) => {
  res.send("Mange your asset with ease");
});

app.listen(port, () => {
  console.log(`Manage your asset using: ${port}`);
});
