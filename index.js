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

    // Get Assets data with search functionality, sort by product_quantity, and filter by product_type
    app.get("/assets", async (req, res) => {
      const { search, sort, product_type } = req.query; // Get the search query, sort option, and product_type filter from the request

      let filter = {}; // Default filter is empty, meaning all assets are fetched

      // If a search query is provided, filter by asset name
      if (search) {
        filter.product_name = { $regex: search, $options: "i" }; // 'i' for case-insensitive search
      }

      // If a product_type filter is provided, add it to the filter
      if (product_type && product_type !== "all") {
        filter.product_type = product_type; // Filter by the specific product_type (Returnable or Non-returnable)
      }

      // Define the sort option based on the query parameter (if provided)
      let sortOption = {};
      if (sort === "asc") {
        sortOption = { product_quantity: 1 }; // Ascending order
      } else if (sort === "desc") {
        sortOption = { product_quantity: -1 }; // Descending order
      }

      try {
        const result = await assetsCollection
          .find(filter) // Apply the filter (search query and product_type filter)
          .sort(sortOption) // Apply sorting by product_quantity
          .toArray();
        res.send(result);
      } catch (error) {
        res
          .status(500)
          .send({ message: "Failed to fetch assets", error: error.message });
      }
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

    // get requested asset using email, search function
    app.get("/requested-asset", async (req, res) => {
      const email = req.query.email;
      const searchQuery = req.query.search || ""; // Search query parameter for asset name
      let query = { requester_email: email };

      try {
        // Fetch requested assets based on email
        const result = await requestedAssetsCollection.find(query).toArray();

        // Fetch asset details and join them with requested assets
        const assetPromises = result.map(async (request) => {
          const assetQuery = { _id: new ObjectId(request.asset_id) }; // Assuming asset_id is an ObjectId
          const asset = await assetsCollection.findOne(assetQuery);
          if (asset) {
            request.asset_name = asset.product_name; // Add product_name from assets collection
            request.asset_type = asset.product_type; // Add product_type from assets collection
          }
          return request;
        });

        const assetsWithDetails = await Promise.all(assetPromises);

        // If a search query is provided, filter by asset_name (case-insensitive)
        const filteredResults = searchQuery
          ? assetsWithDetails.filter((request) =>
              request.asset_name
                .toLowerCase()
                .includes(searchQuery.toLowerCase())
            )
          : assetsWithDetails;

        res.send(filteredResults); // Return the filtered results
      } catch (error) {
        console.error("Error fetching requested assets:", error);
        res.status(500).send({ message: "Internal Server Error" });
      }
    });

    // Get Requested Asset
    app.get("/requested-assets", async (req, res) => {
      const { requester_email, requester_name } = req.query;

      // Build the search query based on which parameter is provided
      let searchQuery = {};
      if (requester_email) {
        searchQuery.requester_email = {
          $regex: requester_email,
          $options: "i",
        }; // Case-insensitive match
      } else if (requester_name) {
        searchQuery.requester_name = { $regex: requester_name, $options: "i" }; // Case-insensitive match
      }

      try {
        // Get the requested assets based on the search query
        const result = await requestedAssetsCollection
          .find(searchQuery)
          .toArray();

        for (const request of result) {
          const query1 = { _id: new ObjectId(request.asset_id) };
          const asset = await assetsCollection.findOne(query1);
          if (asset) {
            request.asset_name = asset.product_name;
            request.asset_type = asset.product_type;
          }
        }

        res.send(result);
      } catch (error) {
        console.error("Error fetching requested assets:", error);
        res.status(500).send("Internal Server Error");
      }
    });

    // Update Requested Asset
    app.patch("/requested-asset/:id", async (req, res) => {
      const id = req.params.id;
      const updateStatus = req.body;

      // Perform the update
      const result = await requestedAssetsCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: updateStatus }
      );

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
