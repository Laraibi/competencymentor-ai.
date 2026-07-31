const mongoose = require("mongoose");

const EvaluationSchema = new mongoose.Schema({
  soumissionId: { type: mongoose.Schema.Types.ObjectId, ref: "Soumission" },
  competenceCode: { type: String, required: true },
  bloc1Prediction: { type: mongoose.Schema.Types.Mixed, default: null },
  bloc2Result: { type: mongoose.Schema.Types.Mixed, default: null },
  formateurValidation: {
    valide: { type: Boolean, default: null },
    commentaire: { type: String, default: "" },
  },
  dateEvaluation: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Evaluation", EvaluationSchema);
