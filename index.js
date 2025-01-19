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

    //! Requested Assets Collection
    const requestedAssetsCollection = client
      .db("AssetEase")
      .collection("requested_Assets");

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

    // Get Employee data using employee_status
    app.get("/employee-account", async (req, res) => {
      // Query to fetch only employees with employee_status: false
      const query = { employee_status: false };
      // Fetch data from the database
      const employees = await employeeAccountCollection.find(query).toArray();
      // Send the result
      res.send(employees);
    });

    // Get Employee data using hr_email
    app.get("/employee-accounts/:email", async (req, res) => {
      const email = req.params.email;
      // Query to fetch only employees with employee_status: false
      const query = { hr_email: email };
      // Fetch data from the database
      const employees = await employeeAccountCollection.find(query).toArray();
      // Send the result
      res.send(employees);
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

    // Patch Employee data
    app.patch("/employee-account/:id", async (req, res) => {
      const id = req.params.id; // Extract the ID from the URL
      const updateData = req.body; // Data to update

      // Convert the string ID to a MongoDB ObjectId
      const filter = { _id: new ObjectId(id) };

      // Perform the update
      const result = await employeeAccountCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: updateData }
      );

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
    app.post("/assets", async (req, res) => {
      const asset = req.body;
      const result = await assetsCollection.insertOne(asset);
      res.send(result);
    });

    // Get Assets data
    app.get("/assets", async (req, res) => {
      const result = await assetsCollection.find().toArray();
      res.send(result);
    });

    // Get Assets using _id data
    app.get("/assets/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await assetsCollection.findOne(query);
      res.send(result);
    });

    //! Requested Asset API

    // Post Requested Asset
    app.post("/requested-asset", async (req, res) => {
      const asset = req.body;
      const result = await requestedAssetsCollection.insertOne(asset);

      const id = asset.asset_id;
      const query = { _id: new ObjectId(id) };
      const assets = await assetsCollection.findOne(query);

      let count = 0;
      if (assets.request_count) {
        count = assets.request_count + 1;
      } else {
        count = 1;
      }

      if (assets.product_quantity) {
        let quantity = Number(assets.product_quantity);
        const updatedQuantity = quantity - 1;

        const filter = { _id: new ObjectId(id) };
        const updatedDoc = {
          $set: {
            request_count: count,
            product_quantity: updatedQuantity, // Update the quantity here
          },
        };

        const updateResult = await assetsCollection.updateOne(
          filter,
          updatedDoc
        );
      }

      res.send(result);
    });

    // Get Requested Asset using email
    app.get("/requested-asset", async (req, res) => {
      const email = req.query.email;
      const query = { requester_email: email };
      const result = await requestedAssetsCollection.find(query).toArray();

      for (const request of result) {
        const query1 = { _id: new ObjectId(request.asset_id) };
        const asset = await assetsCollection.findOne(query1);
        if (asset) {
          request.asset_name = asset.product_name;
          request.asset_type = asset.product_type;
        }
      }

      res.send(result);
    });

    // Get Requested Asset
    app.get("/requested-assets", async (req, res) => {
      const result = await requestedAssetsCollection.find().toArray();
      for (const request of result) {
        const query1 = { _id: new ObjectId(request.asset_id) };
        const asset = await assetsCollection.findOne(query1);
        if (asset) {
          request.asset_name = asset.product_name;
          request.asset_type = asset.product_type;
        }
      }
      res.send(result);
    });

    // Delete Requested Asset and increase product_quantity
    app.delete("/requested-asset/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };

      // Find the requested asset to get the asset_id
      const requestedAsset = await requestedAssetsCollection.findOne(query);
      const assetId = requestedAsset ? requestedAsset.asset_id : null;

      if (assetId) {
        const assetQuery = { _id: new ObjectId(assetId) };
        const asset = await assetsCollection.findOne(assetQuery);

        if (asset) {
          // Increase the product_quantity
          const updatedQuantity = asset.product_quantity + 1;

          const filter = { _id: new ObjectId(assetId) };
          const updatedDoc = {
            $set: {
              product_quantity: updatedQuantity, // Increase the quantity here
            },
          };

          // Update asset collection to increase quantity
          await assetsCollection.updateOne(filter, updatedDoc);
        }
      }

      // Delete the requested asset
      const result = await requestedAssetsCollection.deleteOne(query);
      res.send(result);
    });

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
