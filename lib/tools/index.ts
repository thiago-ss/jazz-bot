import "server-only";

import { getArtistInfoTool } from "./get-artist-info";
import { getSimilarArtistsTool } from "./get-similar-artists";
import { getTagTopArtistsTool } from "./get-tag-top-artists";
import { getTopAlbumsTool } from "./get-top-albums";
import { getTopTracksTool } from "./get-top-tracks";
import { searchArtistTool } from "./search-artist";
import { webSearchTool } from "./web-search";

export const jazzTools = {
  getArtistInfo: getArtistInfoTool,
  getSimilarArtists: getSimilarArtistsTool,
  getTagTopArtists: getTagTopArtistsTool,
  getTopAlbums: getTopAlbumsTool,
  getTopTracks: getTopTracksTool,
  searchArtist: searchArtistTool,
  webSearch: webSearchTool,
};
