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

        app.get('/services', async (req, res) => {
            const query = {};
            const cursor = serviceCollections.find(query);
            const service = await cursor.toArray();
            res.send(service);
        });
        app.get('/available', async (req, res) => {
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