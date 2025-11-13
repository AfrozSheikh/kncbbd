import mongoose from "mongoose";

const projectSchema = new mongoose.Schema({
    title: { type: String, required: true },
    image: { type: String, required: true }, 
    description: { type: String, required: true },
    technologiesUsed: { type: String, required: true },
});

// Always export like this in ESM:
export default mongoose.model("Project", projectSchema);
