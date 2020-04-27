import express from "express";
import bodyParser from "body-parser";
require('dotenv/config');
const admin = require('firebase-admin');
const cors = require('cors');

const app = express();
// app.use(express.json());
const serviceAccount = require("./permissions.json");
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://kebsproj.firebaseio.com"
});
const db = admin.firestore();
app.use(cors());
app.use(bodyParser.json());

const paymentsCollection = "payments";
interface Payment {
    amount: String,
}

// Create new payment
app.post('/payment', async (req, res) => {
    try {
        const payment: Payment = {
            amount: req.body['amount'],
        };

        const newDoc = await db.collection(paymentsCollection).add(payment);
        res.status(201).send(`Created a new payment: ${newDoc.id}`);
    } catch (error) {
        res.status(400).send(`Payment should contain amount!!!`)
    }
});

//get all payments
app.get('/payment', async (req, res) => {
    try {
        const paymentQuerySnapshot = await db.collection(paymentsCollection).get();
        const payments: any[] = [];
        paymentQuerySnapshot.forEach(
            (doc: { id: any; data: () => any; })=>{
                payments.push({
                    id: doc.id,
                    data:doc.data()
                });
            }
        );
        res.status(200).json(payments);
    } catch (error) {
        res.status(500).send(error);
    }
});

//get a single payment
app.get('/payment/:paymentId', (req,res) => {

    const paymentId = req.params.paymentId;
    db.collection(paymentsCollection).doc(paymentId).get()
        .then((payment: { exists: any; id: any; data: () => any; }) => {
            if(!payment.exists) throw new Error('Payment not Found');
            res.status(200).json({id:payment.id, data:payment.data()})})
        .catch((error: any) => res.status(500).send(error));

});

// Update payment
app.put('/payment/:paymentId', async (req, res) => {
    await db.collection(paymentsCollection).doc(req.params.paymentId).set(req.body,{merge:true})
        .then(()=> res.json({id:req.params.paymentId, "message": "updated"}))
        .catch((error: any)=> res.status(500).send(error))

});

// Delete a payment
app.delete('/payment/:paymentId', (req, res) => {
    db.collection(paymentsCollection).doc(req.params.paymentId).delete()
        .then(()=>res.status(200).send("Document successfully deleted!"))
        .catch(function (error: any) {
            res.status(500).send(error);
        });
});

app.listen("3000", () => {
    console.log("Server started at port 3000")
});

