const express = require('express');
const { MongoClient, ServerApiVersion } = require('mongodb');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();
// mongo connection
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.l6guwec.mongodb.net/?retryWrites=true&w=majority`;
// mongo client
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

// middleware
const app = express();
const port = process.env.PORT || 5000;
// app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(express.json());


async function run() {
    try {
        await client.connect();
        const serviceCollections = client.db('doctors_portal-1').collection('services');
        const bookingCollections = client.db('doctors_portal-1').collection('bookings');
        const userCollections = client.db('doctors_portal-1').collection('users');

        app.get('/services', async (req, res) => {
            const query = {};
            const cursor = serviceCollections.find(query);
            const service = await cursor.toArray();
            res.send(service);
        });

        app.put('/users/:email', async (req, res) => {
            console.log('api is hitting')
            const email = req.params.email;
            const user = req.body;
            console.log('user found = ', user);
            const filter = { email: email };
            const options = { upsert: true };
            const updateDoc = {
                $set: user,
            };
            const result = await userCollections.updateOne(filter, updateDoc, options);
            console.log(result);
            res.send(result);
        });

        

        /* app.get('/available', async (req, res) => {
             const date = req.query.date || 'Oct 31, 2022'
             // step 1: get all services            
             const services = await serviceCollections.find().toArray();
             // step 2 : get the booking of that day
             const query = { date: date };
             const bookings = await bookingCollections.find(query).toArray();
             // step 3 : for each service, find bookings for that service
             services.forEach(service => {
                 const serviceBookings = bookings.filter(b => b.treatment === service.name);
                 const booked = serviceBookings.map(s => s.slot);
                 const available = service.slots.filter(s => !booked.includes(s));
                 service.available = available;
 
                 // service.booked = booked;
                 // service.booked = serviceBookings.map(s => s.slot);
             })
             res.send(services);
 
         }) */

        // !warning about this api
        // This is not the proper way to query
        // After learning more about mongodb use aggregate lookup pipeline match group;
        app.get('/available', async (req, res) => {
            const date = req.query.date;
            // step 1: get all services
            const services = await serviceCollections.find().toArray();
            // step 2:  get the booking of that day
            const query = { date: date }
            const bookings = await bookingCollections.find(query).toArray();

            // step 3: for each services
            services.forEach(service => {
                // step 4: find bookings that service output : [{},{},{},{}]
                const serviceBookings = bookings.filter(book => book.treatment === service.name)
                // step 5: select slots for the service bookings: slots
                const bookedSlots = serviceBookings.map(book => book.slot);
                // step 6 : select those slots are not in bookedSlots
                const available = service.slots.filter(slot => !bookedSlots.includes(slot));
                // step 7: set available slots that are not in bookedSlots
                service.slots = available;
            });

            res.send(services);

        })

        app.post('/booking', async (req, res) => {
            const booking = req.body;
            const query = { treatment: booking.treatment, date: booking.date, patient: booking.patient };

            const exists = await bookingCollections.findOne(query);
            if (exists) {
                return res.send({ success: false, booking: exists });
            }
            const result = await bookingCollections.insertOne(booking);
            return res.send({ success: true, result });
        });

        app.get('/booking', async (req, res) => {
            const patient = req.query.patient;
            const query = { patient: patient };
            const bookings = await bookingCollections.find(query).toArray();
            res.send(bookings);
        })

        /**
      * API Naming Convention
      * app.get('/'booking') // get all the booking in this collection or get more than or by filter
      * app.get('/'booking') // get a specific booking
      * app.get('/booking') // add a new booking or create
      * app.patch('/booking/:id') // 
      * app.delete('/booking/:id') // 
      */

    }
    finally {

    }
}

run().catch(console.dir)

app.get('/', (req, res) => {
    res.send('Doctor portal server Running!');
})

app.listen(port, () => {
    console.log(`Running on port ${port}`)
})