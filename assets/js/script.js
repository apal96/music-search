var lastFMToken = "2b80e0b10a244c16881596344e29cbc1";
var lastFMURL = "https://ws.audioscrobbler.com/2.0/?method=";

var bandNameEl = $(".band-name");
var artistBioEl = $(".bio");
var relatedArtistsEl = $("#related-artists");
var artistImageEl = $("#artist-image");
var similarArtistsEl = $("#similar-artists");
var artistTracksEl = $("#artist-tracks");
var albumInfoEl = $("#album-info");
var savedSearchesEl = $("#saved-searches");
var searchInputFormEl = $("#search-input-form");
var searchInputEl = $("#search-input-text");

var savedSearches = [];

// Create a URL to fetch data from LastFM
// method is the value for the LastFM method paramerer
// artist is the value for the LastFM artist parameter (can be undefined if it is not needed)
// track is the value for the LastFM track parameter (can be undefined if it is not needed)
// album is the value for the LastFM album parameter (can be undefined if it is not needed)
function createLastFMURL(method, artist, track, album) {
    var queryURL = lastFMURL + method;
    queryURL += "&api_key=" + lastFMToken;

    if (artist) {
        queryURL += "&artist=" + artist;
    }

    if (track) {
        queryURL += "&track=" + track;
    }

    if (album) {
        queryURL += "&album=" + album;
    }
    queryURL += "&format=json";
    queryURL = encodeURI(queryURL);
    console.log("Last FM URL: " + queryURL);
    return queryURL;
}

// Get information about a song and output the info in an element with ID song-info
function getSongInformation(songName, songArtist) {
    if (!songName || !songArtist) {
        // Song name and artist must be filled into to perform the query
        return;
    }

    fetch(createLastFMURL("track.getInfo", songArtist, songName)).then(function(response) {
        if (response.ok) {
            return response.json();
        } else {
            throw new Error(response.statusText);
        }
    }
    ).then(function (data) {
        console.log(data);
        // Check that the API provides a summary
        if (data.track.wiki && data.track.wiki.summary) {
            var trackInfo = data.track.wiki.summary;
            // Escape ' and ] in the songName so they are not interpreted as part of the CSS selector
            var escapedSongName = songName.replace(/'/g, "\\'");
            escapedSongName = escapedSongName.replace(/]/g, "\\]");
            $("[data-summary-for='" + escapedSongName + "']").html(trackInfo);
        } else {
            console.log("Last FM did not provide a summary for " + songName + " by " + songArtist);
        }
      }
    ).catch(function (error) {
        console.log(error);
    });
}

// Get information about an artist
function getArtistInformation(artist) {
    if (!artist) {
        // artist must be provided
        return;
    }
    
    fetch(createLastFMURL("artist.getInfo", artist, undefined)).then(function(response) {
        if (response.ok) {
            return response.json();
        } else {
            throw new Error(response.statusText);
        }
    }
    ).then(function (data) {
        console.log(data);
        var artistBio = data.artist.bio.summary;
        artistBioEl.html(artistBio);

        // Clear any previously displayed information
        relatedArtistsEl.empty();
        // Show up to 3 related artists
        for (var idx = 0; (idx < data.artist.similar.artist.length) && (idx < 3); idx++) {
            var similarArtistEl = $('<button>');
            similarArtistEl.addClass("flex w-100 bg-washed-blue");
            similarArtistEl.text(data.artist.similar.artist[idx].name);
            relatedArtistsEl.append(similarArtistEl);
        }

        // Show the last image
        if (data.artist.image.length) {
            artistImageEl.attr("src", data.artist.image[data.artist.image.length - 1]["#text"]);
            artistImageEl.attr("alt", "picture of " + artist);
        } else {
            // Show the default image
            artistImageEl.attr("src", "./assets/img/cool-band.jpg");
            artistImageEl.attr("alt", "default picture");
        }
      }
    ).catch(function (error) {
        console.log(error);
    });
}

// Get information about similar artists
function getSimilarArtists(artist) {
    if (!artist) {
        // artist must be provided
        return;
    }
    
    fetch(createLastFMURL("artist.getSimilar", artist, undefined)).then(function(response) {
        if (response.ok) {
            return response.json();
        } else {
            throw new Error(response.statusText);
        }
    }
    ).then(function (data) {
        console.log(data);
        similarArtistsEl.empty();
        // Limit the display to 10 similar artists
        for (var idx = 0; (idx < data.similarartists.artist.length) && (idx < 10); idx++) {
            var similarArtistToDisplayEl = $('<div>');
            similarArtistToDisplayEl.text(data.similarartists.artist[idx].name);

            if (data.similarartists.artist[idx].image.length) {
                // Show the last image
                var artistImageEl = $("<img>");
                artistImageEl.attr("src", data.similarartists.artist[idx].image[data.similarartists.artist[idx].image.length - 1]["#text"]);
                artistImageEl.attr("alt", "picture of " + data.similarartists.artist[idx].name);
                similarArtistToDisplayEl.append(artistImageEl);
            }
            similarArtistsEl.append(similarArtistToDisplayEl);
        }
      }
    ).catch(function (error) {
        console.log(error);
    });
}

// Get tracks for the artist
function getTracksForArtist(artist) {
    if (!artist) {
        // artist must be provided
        return;
    }
    
    fetch(createLastFMURL("artist.gettoptracks", artist, undefined)).then(function(response) {
        if (response.ok) {
            return response.json();
        } else {
            throw new Error(response.statusText);
        }
    }
    ).then(function (data) {
        console.log(data);
        // Clear any previously displayed information
        artistTracksEl.empty();
        // Show the top tracks
        // Limit the display to 10 top tracks
        for (var idx = 0; (idx < data.toptracks.track.length) && (idx < 10); idx++) {
            var trackEl = $('<div>');
            var trackElName = $('<div>')
            // Div to fill in summary info for the song when it is received from the API 
            var trackSummaryEl = $('<div>')
            trackSummaryEl.attr("data-summary-for", data.toptracks.track[idx].name);
            // Div to fill in similar songs when it is received from the API
            var similarSongsEl = $('<ul>')
            similarSongsEl.attr("data-similar-songs-to", data.toptracks.track[idx].name);
            trackElName.text(data.toptracks.track[idx].name);
            trackEl.append(trackElName);
            trackEl.append(trackSummaryEl);
            trackEl.append(similarSongsEl);
            artistTracksEl.append(trackEl);
            // Show information about the song
            getSongInformation(data.toptracks.track[idx].name, artist);
            // Show similar songs
            getSimilarSongs(data.toptracks.track[idx].name, artist);
        }
      }
    ).catch(function (error) {
        console.log(error);
    });
}

// Get similar songs for a song
function getSimilarSongs(songName, songArtist) {
    if (!songName || !songArtist) {
        // Song name and artist must be filled in to perform the query
        return;
    }
    
    fetch(createLastFMURL("track.getSimilar", songArtist, songName)).then(function(response) {
        if (response.ok) {
            return response.json();
        } else {
            throw new Error(response.statusText);
        }
    }
    ).then(function (data) {
        console.log(data);
        // Check if similar tracks were provided
        if (data.similartracks) {
            // Only show 10 similar tracks
            for (var idx = 0; idx < data.similartracks.track.length && (idx < 10); idx++) {
                // Escape ' and ] in the songName so they are not interpreted as part of the CSS selector
                var escapedSongName = songName.replace(/'/g, "\\'");
                escapedSongName = escapedSongName.replace(/]/g, "\\]");
                var parentElem = $("[data-similar-songs-to='" + escapedSongName + "']");
                parentElem = parentElem.append("<li>");
                var similarSongNameEl = $('<span>');
                similarSongNameEl.text(data.similartracks.track[idx].name);
                var similarSongArtistEl = $('<span>');
                similarSongArtistEl.text(data.similartracks.track[idx].artist.name);
                parentElem.append(similarSongNameEl);
                parentElem.append($('<span>,&nbsp</span>'));
                parentElem.append(similarSongArtistEl);
            }
            if (data.similartracks.track.length === 0) {
                console.log("No similar tracks found for: " + songName);
            }
        }
      }
    ).catch(function (error) {
        console.log(error);
    });
}

// Get albums for the artist
function getAlbumsForArtist(artist) {
    if (!artist) {
        // artist must be provided
        return;
    }
    
    fetch(createLastFMURL("artist.gettopalbums", artist, undefined)).then(function(response) {
        if (response.ok) {
            return response.json();
        } else {
            throw new Error(response.statusText);
        }
    }
    ).then(function (data) {
        console.log(data);
        // Clear any previously displayed information
        albumInfoEl.empty();
        // Show the top albums
        // Limit the display to 10 top albums
        for (var idx = 0; (idx < data.topalbums.album.length) && (idx < 10); idx++) {
            var albumEl = $('<div>');
            var albumElName = $('<div>');
            albumElName.text(data.topalbums.album[idx].name);
            // Div to fill in info for the album when it is received from the API 
            var albumInfoFromAPIEl = $('<div>');
            albumInfoFromAPIEl.attr("data-album-info-for", data.topalbums.album[idx].name);
            albumEl.append(albumElName);
            albumEl.append(albumInfoFromAPIEl);
            albumInfoEl.append(albumEl);
            // Query the API for the album information
            getAlbumInformation(artist, data.topalbums.album[idx].name);
        }
      }
    ).catch(function (error) {
        console.log(error);
    });
}

// Get the information for an album
function getAlbumInformation(artist, album) {
    if (!artist || !album) {
        // artist and album must be provided
        return;
    }

    fetch(createLastFMURL("album.getinfo", artist, undefined, album)).then(function(response) {
        if (response.ok) {
            return response.json();
        } else {
            throw new Error(response.statusText);
        }
    }
    ).then(function (data) {
        console.log(data);
        // Escape ' and ] in the songName so they are not interpreted as part of the CSS selector
        var escapedAlbumName = album.replace(/'/g, "\\'");
        escapedAlbumName = escapedAlbumName.replace(/]/g, "\\]");
        var parentElem = $("[data-album-info-for='" + escapedAlbumName + "']");
        // Check that the summary is available
        if (data.album && data.album.wiki) {
            // Add a summary
            var summaryText = data.album.wiki.summary;
            var summaryEl = $('<div>');
            summaryEl.html(summaryText);
            parentElem.append(summaryEl);
        } else {
            console.log("No summary available for " + album);
        }
        // Add any images
        var albumImagesEl = $('<div>');
        if (data.album.image.length) {
            // Show the last image
            var albumImageEl = $("<img>");
            albumImageEl.attr("src", data.album.image[data.album.image.length - 1]["#text"]);
            albumImageEl.attr("alt",  album);
            albumImagesEl.append(albumImageEl);
        }
        parentElem.append(albumImagesEl);

      }
    ).catch(function (error) {
        console.log(error);
    });
}

function initializeSavedSearches() {
    // Initialize the saved searches from local storage
    // Load any saved searches from local storage
    var fromLocalStorage = localStorage.getItem("savedSearches");

    if (fromLocalStorage) {
        savedSearches = JSON.parse(fromLocalStorage);
        // Display the list of cities
        displaySavedSearches();
    }
}

// Display the saved searches
function displaySavedSearches() {
    // Clear what's displayed
    savedSearchesEl.empty();

    for (var idx = 0; idx < savedSearches.length; idx++) {
        // Create button element similar to this element
        // <button class="recent-1 flex w-100 bg-washed-blue">btn 1</button> 
        var searchEl = $("<button>");
        searchEl.addClass("flex w-100 bg-washed-blue");
        searchEl.text(savedSearches[idx]);
        savedSearchesEl.append(searchEl);
    }
}

// Handle submit events for the search input
searchInputFormEl.submit(function(event) {
    event.preventDefault();
    var searchInput = searchInputEl.val();

    if (!searchInput) {
        // Nothing was entered
        return;
    }

    if (savedSearches.indexOf(searchInput) === -1) {
        // New artist so add it to the search list
        savedSearches.push(searchInput);
        // Keep the list in sorted order
        savedSearches.sort();
        // Save to local storage so previous searches will show when the page is reloaded
        localStorage.setItem("savedSearches", JSON.stringify(savedSearches));

        // Display the list of searches
        displaySavedSearches();
    }

    // Clear the input field's value
    searchInputEl.val("");

    // Show the bandName
    bandNameEl.text(searchInput);

    // Get the artist information and display it
    getArtistInformation(searchInput);
});

// Show any persisted saved searches
initializeSavedSearches();