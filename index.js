const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config()
const stripe = require('stripe')(process.env.PAYMENT_SECRET_KEY)
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
    // await client.connect();
     client.connect();
  


    
     const usersCollection = client.db("sports").collection("users");
     const classesCollection = client.db("sports").collection("classes");
     const cartCollection = client.db("sports").collection("carts");
     const paymentCollection = client.db("sports").collection("payments");



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
      
      const approvedClasses = await classesCollection.find({ status: 'approved' }).toArray();
      res.send(approvedClasses);
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  });

   // cart collection apis
   app.get('/carts', async (req, res) => {
    const email = req.query.email;

    if (!email) {
      res.send([]);
    }
    const query = { email: email };
    const result = await cartCollection.find(query).toArray();
    res.send(result);
  });

  app.post('/carts', async (req, res) => {
    const item = req.body;
    console.log(item);
    const result = await cartCollection.insertOne(item);
    res.send(result);
  })

  app.delete('/carts/:id', async (req, res) => {
    const id = req.params.id;
    const query = { _id: new ObjectId(id) };
    const result = await cartCollection.deleteOne(query);
    res.send(result);
  })

     // create payment intent
     app.post('/create-payment-intent', async (req, res) => {
      const { price } = req.body;
      const amount = parseInt(price * 100);
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: 'usd',
        payment_method_types: ['card']
      });

      res.send({
        clientSecret: paymentIntent.client_secret
      })
    })

    //payment
    app.get('/payments', async (req, res) => {
      const email = req.query.email;
  
      if (!email) {
        res.send([]);
      }
      const query = { email: email };
      const result = await paymentCollection.find(query).toArray();
      res.send(result);
    });

    app.post('/payments', async (req, res) => {
      const payment = req.body;
      // const classItemId = req.query.classItemId;
      const { _id,classItemId, email } = payment;
      // console.log(234,payment) 
      const item = await cartCollection.findOne({ _id:  new ObjectId(classItemId) })  
      console.log(item) 
      const deleteResult = await cartCollection.deleteOne({ _id:  new ObjectId(classItemId) });
    
      const updateResult = await classesCollection.updateOne(
        { _id: new ObjectId(item.classItemId) },
        {
          $inc: {
            availableSeats: -1,
            enrolledStudents: 1
          }
        }
      );
    // console.log(updateResult)
     
      const insertResult = await paymentCollection.insertOne(payment);
    
      res.send({ deleteResult, updateResult, insertResult });
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