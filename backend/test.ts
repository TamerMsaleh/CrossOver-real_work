import { performance } from "perf_hooks";
import supertest from "supertest";
import { buildApp } from "./app";

const app = supertest(buildApp());
const waiting = 50;

async function basicLatencyTest() {
    await app.post("/reset").expect(204);
    const start = performance.now();
    await app.post("/charge").expect(200);
    await app.post("/charge").expect(200);
    await app.post("/charge").expect(200);
    await app.post("/charge").expect(200);
    await app.post("/charge").expect(200);
    console.log(`Latency: ${performance.now() - start} ms`);
}

async function concurrent() {
    await app.post("/reset").send({account: "test"}).expect(204);
    const start = performance.now();

    const chargePromises = [];
    // Create an array of charge requests to be sent in parallel
    for (let i = 5; i >= 1; i--) {
        chargePromises.push(
            app.post("/charge").send({ account: `test`, charges: 20 * i }).expect(200)
        );
    }
    const responses = await Promise.all(chargePromises);

    responses.forEach((response, index) => {
        console.log(`Request ${index + 1}:`);
        console.log(`Status: ${response.status}`);
        console.log(`Authorization: ${response.body.isAuthorized}`);
        console.log(`Charges: ${response.body.charges}`);
        console.log(`Remaining Balance: ${response.body.remainingBalance}`);
        console.log('------------------------');
    });
}

async function runTests() {
    await basicLatencyTest(); 
    await concurrent();
}

runTests().catch(console.error);
