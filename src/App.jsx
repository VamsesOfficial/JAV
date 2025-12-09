import React, { useState } from 'react';
import { Search, Download, Play, Eye, Star, Clock, User, Calendar, Tag, Loader, AlertCircle } from 'lucide-react';

const ImageIcon = ({ className, size }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
    <circle cx="8.5" cy="8.5" r="1.5"></circle>
    <polyline points="21 15 16 10 5 21"></polyline>
  </svg>
);

const App = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingVideo, setIsLoadingVideo] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setError('Please enter a search keyword');
      return;
    }
    
    setIsSearching(true);
    setError('');
    setSelectedVideo(null);
    
    try {
      const response = await fetch(`/api/javsearch?keyword=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      
      if (data.code === 200 && data.results) {
        setSearchResults(data.results);
        if (data.results.length === 0) {
          setError('No results found for your search');
        }
      } else {
        setError(data.msg || 'Failed to search videos');
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Search error:', error);
      setError('Connection error. Please try again.');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectVideo = async (video) => {
    if (!video.url) {
      setError('Video URL not available');
      return;
    }

    setIsLoadingVideo(true);
    setError('');
    
    try {
      const response = await fetch(`/api/javdl?url=${encodeURIComponent(video.url)}`);
      const data = await response.json();
      
      if (data.code === 200) {
        setSelectedVideo(data);
      } else {
        setError(data.msg || 'Failed to load video details');
      }
    } catch (error) {
      console.error('Load video error:', error);
      setError('Failed to load video details. Please try again.');
    } finally {
      setIsLoadingVideo(false);
    }
  };

  const getVideoUrl = (videoSources) => {
    if (!videoSources) return '';
    return videoSources['1080p'] || videoSources['720p'] || videoSources['480p'] || '';
  };

  const getVideoQuality = (videoSources) => {
    if (!videoSources) return 'Unknown';
    if (videoSources['1080p']) return '1080p (Full HD)';
    if (videoSources['720p']) return '720p (HD)';
    if (videoSources['480p']) return '480p (SD)';
    return 'Unknown';
  };

  const handleDownload = async (url, title) => {
    if (!url) {
      setError('Download URL not available');
      return;
    }

    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${title.replace(/[^a-z0-9]/gi, '_')}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Download error:', error);
      // Fallback: open in new tab
      window.open(url, '_blank');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50">
      {/* Header */}
      <header className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center">
                <Download className="text-white" size={24} />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Video Downloader
              </h1>
            </div>
          </div>
          
          {/* Search Bar */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search for videos..."
                className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none transition-colors"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={isSearching}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSearching ? <Loader className="animate-spin" size={20} /> : 'Search'}
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-center gap-3">
            <AlertCircle className="text-red-600 flex-shrink-0" size={24} />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Selected Video Detail */}
        {selectedVideo && (
          <div className="mb-8 bg-white rounded-2xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="p-6">
              <button
                onClick={() => setSelectedVideo(null)}
                className="mb-4 text-purple-600 hover:text-purple-800 transition-colors flex items-center gap-2 font-medium"
              >
                 Back to results
              </button>
              
              <h2 className="text-3xl font-bold text-gray-800 mb-4">{selectedVideo.title}</h2>
              
              {/* Video Player */}
              {getVideoUrl(selectedVideo.videoSources) ? (
                <div className="relative rounded-xl overflow-hidden bg-black mb-6 shadow-2xl">
                  <video
                    controls
                    className="w-full aspect-video"
                    poster={selectedVideo.screenshots && selectedVideo.screenshots[0]}
                    src={getVideoUrl(selectedVideo.videoSources)}
                    preload="metadata"
                  >
                    Your browser does not support video playback.
                  </video>
                </div>
              ) : (
                <div className="relative rounded-xl overflow-hidden bg-gray-200 mb-6 aspect-video flex items-center justify-center">
                  <p className="text-gray-500">Video preview not available</p>
                </div>
              )}

              {/* Download Button */}
              {getVideoUrl(selectedVideo.videoSources) && (
                <button
                  onClick={() => handleDownload(getVideoUrl(selectedVideo.videoSources), selectedVideo.title)}
                  className="w-full mb-6 px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-3 text-lg font-semibold"
                >
                  <Download size={24} />
                  Download Video ({getVideoQuality(selectedVideo.videoSources)})
                </button>
              )}

              {/* Video Info Grid */}
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-3">
                  {selectedVideo.uploader && (
                    <div className="flex items-center gap-3 text-gray-700">
                      <User className="text-purple-600 flex-shrink-0" size={20} />
                      <span className="font-semibold">Uploader:</span>
                      <span className="truncate">{selectedVideo.uploader}</span>
                    </div>
                  )}
                  {selectedVideo.views && (
                    <div className="flex items-center gap-3 text-gray-700">
                      <Eye className="text-blue-600 flex-shrink-0" size={20} />
                      <span className="font-semibold">Views:</span>
                      <span>{selectedVideo.views}</span>
                    </div>
                  )}
                </div>
                <div className="space-y-3">
                  {selectedVideo.submitted && (
                    <div className="flex items-center gap-3 text-gray-700">
                      <Calendar className="text-pink-600 flex-shrink-0" size={20} />
                      <span className="font-semibold">Submitted:</span>
                      <span>{selectedVideo.submitted}</span>
                    </div>
                  )}
                  {selectedVideo.videoSources && (
                    <div className="flex items-center gap-3 text-gray-700">
                      <Play className="text-green-600 flex-shrink-0" size={20} />
                      <span className="font-semibold">Quality:</span>
                      <span>{getVideoQuality(selectedVideo.videoSources)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Categories */}
              {selectedVideo.categories && selectedVideo.categories.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Tag className="text-purple-600" size={20} />
                    <span className="font-semibold text-gray-700">Categories:</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedVideo.categories.map((cat, idx) => (
                      <span key={idx} className="px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              {selectedVideo.description && (
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-700 mb-2">Description:</h3>
                  <p className="text-gray-600 leading-relaxed">{selectedVideo.description}</p>
                </div>
              )}

              {/* Screenshots */}
              {selectedVideo.screenshots && selectedVideo.screenshots.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <ImageIcon className="text-blue-600" size={20} />
                    <span className="font-semibold text-gray-700">Screenshots:</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {selectedVideo.screenshots.map((screenshot, idx) => (
                      <img
                        key={idx}
                        src={screenshot}
                        alt={`Screenshot ${idx + 1}`}
                        className="w-full h-32 object-cover rounded-lg shadow-md hover:shadow-xl transition-shadow cursor-pointer"
                        loading="lazy"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Search Results */}
        {!selectedVideo && searchResults.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              Search Results ({searchResults.length})
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {searchResults.map((video, idx) => (
                <div
                  key={idx}
                  onClick={() => handleSelectVideo(video)}
                  className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all cursor-pointer transform hover:-translate-y-1"
                >
                  <div className="relative">
                    {video.thumbnail ? (
                      <img
                        src={video.thumbnail}
                        alt={video.title}
                        className="w-full h-48 object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-400">No preview</span>
                      </div>
                    )}
                    {video.duration && (
                      <div className="absolute bottom-2 right-2 bg-black bg-opacity-80 text-white px-2 py-1 rounded text-sm flex items-center gap-1">
                        <Clock size={14} />
                        {video.duration}
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-gray-800 mb-3 line-clamp-2 hover:text-purple-600 transition-colors">
                      {video.title}
                    </h3>
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      {video.views && (
                        <div className="flex items-center gap-1">
                          <Eye size={16} />
                          <span>{video.views}</span>
                        </div>
                      )}
                      {video.rating && (
                        <div className="flex items-center gap-1">
                          <Star size={16} className="fill-yellow-400 text-yellow-400" />
                          <span>{video.rating}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!selectedVideo && searchResults.length === 0 && !isSearching && !error && (
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="text-purple-600" size={48} />
            </div>
            <h3 className="text-2xl font-bold text-gray-700 mb-2">Start Your Search</h3>
            <p className="text-gray-500">Enter a keyword to find amazing videos</p>
          </div>
        )}

        {/* Loading State */}
        {isLoadingVideo && (
          <div className="text-center py-20">
            <Loader className="animate-spin text-purple-600 mx-auto mb-4" size={48} />
            <p className="text-gray-600">Loading video details...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;