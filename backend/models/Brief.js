const mongoose = require("mongoose");

const BriefSchema = new mongoose.Schema({
  titre: { type: String, required: true },
  criteresPerformance: { type: [String], default: [] },
  competencesViseesCodes: { type: [String], default: [] },
});

module.exports = mongoose.model("Brief", BriefSchema);
