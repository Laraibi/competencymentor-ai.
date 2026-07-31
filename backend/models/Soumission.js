const mongoose = require("mongoose");

const SoumissionSchema = new mongoose.Schema({
  studentName: { type: String, required: true },
  briefId: { type: mongoose.Schema.Types.ObjectId, ref: "Brief" },
  files: { type: Map, of: String, required: true },
  dateSoumission: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Soumission", SoumissionSchema);
