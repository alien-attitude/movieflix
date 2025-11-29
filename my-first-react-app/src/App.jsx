import React, {useEffect, useState} from 'react';
import Search from "./components/Search.jsx";
import Spinner from "./components/Spinner.jsx";
import MovieCard from "./components/MovieCard.jsx";
import {useDebounce} from "react-use";
import {getTrendingMovies, updateSearchCount} from "./appwrite.js";

const API_BASE_URL = "https://api.themoviedb.org/3/";

const API_KEY = import.meta.env.VITE_TMDB_API_KEY;

const API_OPTIONS = {
    method: "GET",
    headers: {
        accept: "application/json",
        Authorization: `Bearer ${API_KEY}`
    }
};

const App = () => {
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
    const [searchTerm, setSearchTerm] = useState("")

    const [movies, setMovies] = useState([])
    const [errorMessage, setErrorMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false)

    const [trendingMovies, setTrendingMovies] = useState([])
    const [errorTrendingMovies, setErrorTrendingMovies] = useState("")
    const [isLoadingTrendingMovies, setIsLoadingTrendingMovies] = useState(false)

    useDebounce(() => setDebouncedSearchTerm(searchTerm), 1000, [searchTerm])

    const fetchMovies = async (query = '') => {
        setIsLoading(true)
        setErrorMessage('')

        try {
            const endpoint = query? `${API_BASE_URL}search/movie?query=${encodeURIComponent(query)}&page=1`
                :`${API_BASE_URL}discover/movie?sort_by=popularity.desc`;

            const response = await fetch(endpoint, API_OPTIONS);

            if (!response.ok) {
                throw new Error(`Error fetching movies: ${response.statusText}`);
            }
            const data = await response.json();
            console.log(data);

            if(data.Response === "False"){
                setErrorMessage(data.Error || "Failed to fetch movies")
                setMovies([])
                return;
            }

            if (!Array.isArray(data.results)) {
                setErrorMessage("Failed to fetch movies");
                setMovies([]);
                return;
            }

            setMovies(data.results || [])

            if (query && data.results.length > 0) {
                await updateSearchCount(query, data.results[0]);
            }
        } catch (error) {
            console.log(` Error fetching movies: ${error}`);
            setErrorMessage("Error fetching movies, please try again later");
        } finally {
            setIsLoading(false)
        }

    }

    const fetchTrendingMovies = async () => {
        setIsLoadingTrendingMovies(true)
        setErrorTrendingMovies("")

        try {
            const movies = await getTrendingMovies();
            console.log(movies);

            if(!Array.isArray(movies)){
                setErrorTrendingMovies("Failed to fetch trending movies")
                setTrendingMovies([])
                return;
            }

            setTrendingMovies(movies);
        } catch (error) {
            console.log(` Error fetching trending movies: ${error}`);
            //setErrorMessage("Error fetching trending movies, please try again later");
        } finally {
            setIsLoadingTrendingMovies(false)
        }
    }

    useEffect(() => {
        fetchMovies(debouncedSearchTerm);
    }, [debouncedSearchTerm])

    useEffect(() => {
        fetchTrendingMovies();
    }, [])

    return (
        <main>
            <div className="pattern"/>

            <div className="wrapper">
                <header>
                    <img src="/hero.png" alt="Hero Banner"/>
                    <h1>Find <span className="text-gradient">Movies</span> You'll enjoy Without a Hassle</h1>

                    <Search searchTerm={searchTerm} setSearchTerm={setSearchTerm}/>
                </header>

                {trendingMovies.length > 0 && (
                    <section className="trending">
                        <h2>Trending Now</h2>

                        {isLoadingTrendingMovies ? (
                            <Spinner/>
                        ) : errorTrendingMovies ? (
                            <p className="text-red-500">{errorTrendingMovies}</p>
                        ) : (
                            <ul>
                                {trendingMovies.map((movie, index) => (
                                    <li key={movie.$id}>
                                        <p>{index + 1}</p>
                                        <img src={movie.poster_url} alt={movie.title} loading="lazy"/>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>
                )}

                <section className="all-movies">
                    <h2 >All movies</h2>

                    {isLoading ? (
                        <Spinner/>
                    ) : errorMessage ? (
                        <p className="text-red-500">{errorMessage}</p>
                    ) :(
                        <ul>
                            {movies.map((movie) => (
                                <MovieCard key={movie.id} movie={movie}/>
                            ))}
                        </ul>
                    )}
                </section>
                <h1 className="text-white">{searchTerm}</h1>
            </div>
        </main>
    );
};

export default App;