require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors());

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = "https://api.themoviedb.org/3";

// Proxy route for TMDB requests
app.get("/api/movies", async (req, res) => {
  try {
    const { query } = req.query;
    const endpoint = query
      ? `${TMDB_BASE_URL}/search/movie?query=${encodeURIComponent(query)}`
      : `${TMDB_BASE_URL}/discover/movie?sort_by=popularity.desc`;

    const response = await axios.get(endpoint, {
      headers: {
        accept: "application/json",
        Authorization: `Bearer ${TMDB_API_KEY}`,
      },
    });

    res.json(response.data);
  } catch (error) {
    console.error("Error fetching movies:", error.message);
    res.status(500).json({ error: "Failed to fetch movies" });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
