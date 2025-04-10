require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*'
}));

// Environment variables
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = process.env.TMDB_BASE_URL || "https://api.themoviedb.org/3";

// Configure headers for TMDB API requests
const tmdbHeaders = {
  accept: "application/json",
  Authorization: `Bearer ${TMDB_API_KEY}`,
};

// Helper function to handle API requests
const handleTmdbRequest = async (endpoint, params = {}, res) => {
  try {
    const url = `${TMDB_BASE_URL}${endpoint}`;
    const response = await axios.get(url, {
      headers: tmdbHeaders,
      params
    });
    return res.json(response.data);
  } catch (error) {
    console.error(`Error fetching from TMDB: ${endpoint}`, error.message);
    return res.status(error.response?.status || 500).json({
      error: `Failed to fetch data: ${error.message}`,
      endpoint
    });
  }
};

// Root route
app.get("/", (req, res) => {
  res.send("TMDB Proxy API is running");
});

// Movies routes
app.get("/api/movies", async (req, res) => {
  const { query, page = 1 } = req.query;
  const endpoint = query
    ? `/search/movie`
    : `/discover/movie`;
  
  const params = {
    page,
    sort_by: "popularity.desc",
    ...(query && { query })
  };
  
  await handleTmdbRequest(endpoint, params, res);
});

app.get("/api/movies/popular", async (req, res) => {
  const { page = 1 } = req.query;
  await handleTmdbRequest("/movie/popular", { page }, res);
});

app.get("/api/movies/top_rated", async (req, res) => {
  const { page = 1 } = req.query;
  await handleTmdbRequest("/movie/top_rated", { page }, res);
});

app.get("/api/movies/upcoming", async (req, res) => {
  const { page = 1 } = req.query;
  await handleTmdbRequest("/movie/upcoming", { page }, res);
});

app.get("/api/movies/now_playing", async (req, res) => {
  const { page = 1 } = req.query;
  await handleTmdbRequest("/movie/now_playing", { page }, res);
});

app.get("/api/movies/:id", async (req, res) => {
  const { id } = req.params;
  await handleTmdbRequest(`/movie/${id}`, { append_to_response: "videos,credits,similar,recommendations" }, res);
});

app.get("/api/movies/:id/credits", async (req, res) => {
  const { id } = req.params;
  await handleTmdbRequest(`/movie/${id}/credits`, {}, res);
});

app.get("/api/movies/:id/videos", async (req, res) => {
  const { id } = req.params;
  await handleTmdbRequest(`/movie/${id}/videos`, {}, res);
});

app.get("/api/movies/:id/similar", async (req, res) => {
  const { id } = req.params;
  const { page = 1 } = req.query;
  await handleTmdbRequest(`/movie/${id}/similar`, { page }, res);
});

app.get("/api/movies/:id/recommendations", async (req, res) => {
  const { id } = req.params;
  const { page = 1 } = req.query;
  await handleTmdbRequest(`/movie/${id}/recommendations`, { page }, res);
});

// TV Shows routess
app.get("/api/tv/popular", async (req, res) => {
  const { page = 1 } = req.query;
  await handleTmdbRequest("/tv/popular", { page }, res);
});

app.get("/api/tv/:id", async (req, res) => {
  const { id } = req.params;
  await handleTmdbRequest(`/tv/${id}`, { append_to_response: "videos,credits,similar,recommendations" }, res);
});

// People routes
app.get("/api/person/:id", async (req, res) => {
  const { id } = req.params;
  await handleTmdbRequest(`/person/${id}`, { append_to_response: "movie_credits,tv_credits" }, res);
});

// Genres routes
app.get("/api/genres/movie", async (req, res) => {
  await handleTmdbRequest("/genre/movie/list", {}, res);
});

app.get("/api/genres/tv", async (req, res) => {
  await handleTmdbRequest("/genre/tv/list", {}, res);
});

// Discover routes with filters
app.get("/api/discover/movie", async (req, res) => {
  const { 
    page = 1, 
    sort_by = "popularity.desc", 
    with_genres,
    year,
    vote_average_gte,
    with_watch_providers
  } = req.query;
  
  const params = { 
    page, 
    sort_by,
    ...(with_genres && { with_genres }),
    ...(year && { year }),
    ...(vote_average_gte && { "vote_average.gte": vote_average_gte }),
    ...(with_watch_providers && { with_watch_providers })
  };
  
  await handleTmdbRequest("/discover/movie", params, res);
});

app.get("/api/discover/tv", async (req, res) => {
  const { 
    page = 1, 
    sort_by = "popularity.desc", 
    with_genres,
    first_air_date_year,
    vote_average_gte
  } = req.query;
  
  const params = { 
    page, 
    sort_by,
    ...(with_genres && { with_genres }),
    ...(first_air_date_year && { first_air_date_year }),
    ...(vote_average_gte && { "vote_average.gte": vote_average_gte })
  };
  
  await handleTmdbRequest("/discover/tv", params, res);
});

// Search multi (movies, tv, people)
app.get("/api/search/multi", async (req, res) => {
  const { query, page = 1 } = req.query;
  if (!query) {
    return res.status(400).json({ error: "Query parameter is required" });
  }
  await handleTmdbRequest("/search/multi", { query, page }, res);
});

// Add specific endpoint for movie search
app.get("/api/search/movie", async (req, res) => {
  const { 
    query, 
    page = 1, 
    year = null, 
    primary_release_year = null,
    include_adult = false 
  } = req.query;
  
  if (!query) {
    return res.status(400).json({ error: "Query parameter is required" });
  }
  
  const params = { 
    query, 
    page, 
    include_adult: include_adult === 'true',
    // Use either year or primary_release_year if provided
    ...(primary_release_year && { primary_release_year }),
    ...(year && !primary_release_year && { year })
  };
  
  await handleTmdbRequest("/search/movie", params, res);
});

// For backwards compatibility with your existing code
app.get("/api/search/movies", async (req, res) => {
  // Redirect to the /api/search/movie endpoint
  const queryParams = new URLSearchParams(req.query).toString();
  res.redirect(`/api/search/movie?${queryParams}`);
});

// Start the server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
