const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config()
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());




const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.yrxlyvn.mongodb.net/?retryWrites=true&w=majority`;

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
     await client.connect();
  


    
     const usersCollection = client.db("sports").collection("users");
     const classesCollection = client.db("sports").collection("classes");



    //user realated apis
    app.get('/users', async (req, res) => {
        const result = await usersCollection.find().toArray();
        res.send(result);
      });

    app.post('/users', async (req, res) => {
        const user = req.body;
       console.log(user);
       const query = { email: user.email }
       const existingUser = await usersCollection.findOne(query);

       if (existingUser) {
         return res.send({ message: 'user already exists' })
       }
        const result = await usersCollection.insertOne(user);
        res.send(result);
      });

      // check admin
    app.get('/users/admin/:email', async (req, res) => {
      const email = req.params.email;

      // if (req.decoded.email !== email) {
      //   res.send({ admin: false })
      // }

      const query = { email: email }
      const user = await usersCollection.findOne(query);
      const result = { admin: user?.role === 'Admin' }
      res.send(result);
    })

    app.patch('/users/admin/:id', async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          role: 'Admin'
        },
      };

      const result = await usersCollection.updateOne(filter, updateDoc);
      res.send(result);

    })

      // check instructor
    app.get('/users/instructor/:email', async (req, res) => {
      const email = req.params.email;


      const query = { email: email }
      const user = await usersCollection.findOne(query);
      const result = { instructor: user?.role === 'Instructor' }
      res.send(result);
    })

    app.patch('/users/instructor/:id', async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          role: 'Instructor'
        },
      };

      const result = await usersCollection.updateOne(filter, updateDoc);
      res.send(result);

    })

    
    app.get('/users/instructors', async (req, res) => {
      try {
        const instructors = await usersCollection.find({ role: 'Instructor' }).toArray();
        res.send(instructors);
      } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
      }
    });
    

    

    

     //classes related apis

     app.get('/classes', async (req, res) => {
      const result = await classesCollection.find().toArray();
      res.send(result);
    });
     app.post('/classes', async (req, res) => {
      const classes = req.body;
      console.log(classes)
      const result = await classesCollection.insertOne(classes);
      res.send(result);
  });

  app.put('/classes/:id', async (req, res) => {
    try {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedClass = req.body;
  
      const updateFields = {
        $set: {
          status: updatedClass.status,
          feedback: updatedClass?.feedback,
        },
      };
  
      const result = await classesCollection.updateOne(filter, updateFields);
      res.send(result);
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  });

  app.get('/classes/approved', async (req, res) => {
    try {
      // Fetch the approved classes from the database
      const approvedClasses = await classesCollection.find({ status: 'approved' }).toArray();
      res.send(approvedClasses);
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  });
  



      
  

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('sports is running')
})

app.listen(port, () => {
    console.log(`sports is running on port ${port}`);
})