import { MongoClient } from 'mongodb';

const uri = "mongodb+srv://quitanda:quitanda2003mo@mycluster.4kvwvjs.mongodb.net/?retryWrites=true&w=majority&appName=myCluster";

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
let db;

async function saveToMongoDb(dataToStore) {
  try {
    await client.connect();

    //Set the db and the collection
    const db = client.db("Journal");
    const col = db.collection("News");

    const news = await col.insertMany(dataToStore);
    
    return console.log("Saved!");

  } catch (err) {
    console.error("Error connecting to MongoDB Atlas:", err);
  }
}



export { saveToMongoDb, client };
