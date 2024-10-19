import express from "express";
import db from "@repo/db/client";
const app = express();

app.post("/hdfcWebhook", async (req, res) => {
    //TODO: Add zod validation here?
    //Check if it actually came from the HDFC, use a webhook secret here
    const paymentInformation = {
        token: String,
        userId: String,
        amount: String
    } = {
        token: req.body.token,
        userId: req.body.user_identifier,
        amount: req.body.amount
    };
    //we could also find first and update later
    //But this would give issue if multiple request came together
    //Prev balance: 0
    //Request 1: 0 +  100
    //Request 2: 0 + 200
    //New balance is 200, but it should be 300, so increment is a better option

    try {
        await db.$transaction([
            db.balance.updateMany({
                where: {
                    userId: Number(paymentInformation.userId)
                },
                data: {
                    amount: {
                        // You can also get this from your DB
                        increment: Number(paymentInformation.amount)
                    }
                }
            }),
            db.onRampTransaction.updateMany({
                where: {
                    token: paymentInformation.token
                },
                data: {
                    status: "Success",
                }
            })
        ]);

        res.json({
            message: "Captured"
        })
    } catch (e) {
        console.error(e);
        res.status(411).json({
            message: "Error while processing webhook"
        })
    }

})

app.listen(3003);