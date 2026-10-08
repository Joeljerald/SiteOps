import express from "express";
import cors from "cors";
import siteRoutes from "./routes/siteRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import installationRoutes from "./routes/installationRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Site Operations API is running",
  });
});

app.use("/api/sites", siteRoutes);
app.use("/api/users", userRoutes);
app.use("/api/installations", installationRoutes);
app.use("/api/dashboard", dashboardRoutes);

export default app;