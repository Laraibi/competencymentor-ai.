const mongoose = require("mongoose");

const CompetenceSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  libelle: { type: String, required: true },
  description: { type: String, required: true },
  niveauxAttendus: { type: [String], default: [] },
});

module.exports = mongoose.model("Competence", CompetenceSchema);
