const mongoose = require("mongoose");

async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.warn("⚠️  MONGODB_URI absente — l'API démarre sans persistance (mode démo).");
    return;
  }
  try {
    await mongoose.connect(uri);
    console.log("✅ MongoDB Atlas connecté");
  } catch (err) {
    console.warn("⚠️  Connexion MongoDB échouée — l'API continue sans persistance :", err.message);
  }
}

function isDbConnected() {
  return mongoose.connection.readyState === 1;
}

module.exports = { connectDB, isDbConnected };
