document.addEventListener('DOMContentLoaded', function() {
    const musicPlayer = document.getElementById('music-player');
    const themeToggle = document.getElementById('theme-toggle');
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');
    const albumArt = document.getElementById('album-art');
    const songTitle = document.getElementById('song-title');
    const songArtist = document.getElementById('song-artist');
    const progressBar = document.getElementById('progress-bar');
    const progress = document.getElementById('progress');
    const playPauseBtn = document.getElementById('play-pause-btn');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const volumeSlider = document.getElementById('volume-slider');
    const audioPlayer = document.getElementById('audio-player');
    const unavailableMessage = document.getElementById('unavailable-message');
    const loopBtn = document.getElementById('loop-btn');
    
    let currentSongIndex = 0;
    let songs = [];
    let isPlaying = false;
    let loopState = 0;
    let hasLoopedOnce = false;
    let isTypingInSearch = false;

    searchInput.addEventListener('focus', function() {
        isTypingInSearch = true;
    });

    searchInput.addEventListener('blur', function() {
        isTypingInSearch = false;
    });
    
    themeToggle.addEventListener('click', function() {
        musicPlayer.classList.toggle('dark-mode');
        musicPlayer.classList.toggle('light-mode');
        const icon = themeToggle.querySelector('i');
        if (musicPlayer.classList.contains('light-mode')) {
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun');
        } else {
            icon.classList.remove('fa-sun');
            icon.classList.add('fa-moon');
        }
    });
    
    searchBtn.addEventListener('click', searchSong);
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchSong();
        }
    });
    
    loopBtn.addEventListener('click', function() {
        loopState = (loopState + 1) % 3;
        hasLoopedOnce = false;
        updateLoopButton();
    });
    
    function updateLoopButton() {
        switch(loopState) {
            case 0:
                loopBtn.innerHTML = '<i class="fas fa-repeat"></i>';
                loopBtn.style.color = '';
                break;
            case 1:
                loopBtn.innerHTML = '<i class="fas fa-repeat"></i><span class="loop-count">1</span>';
                loopBtn.style.color = '#007bff';
                break;
            case 2:
                loopBtn.innerHTML = '<i class="fas fa-infinity"></i>';
                loopBtn.style.color = '#007bff';
                break;
        }
    }
    
    async function searchSong() {
        const query = searchInput.value.trim();
        if (!query) {
            updateUnavailableMessage("Please enter a song name");
            return;
        }
        
        updateUnavailableMessage(`Searching for "${query}"...`);
        
        try {
            const response = await fetch(`https://saavn.dev/api/search/songs?query=${encodeURIComponent(query)}`);
            const data = await response.json();
            
            songs = data.data.results;
            if (!songs || songs.length === 0) {
                updateUnavailableMessage("No songs found");
                return;
            }
            
            currentSongIndex = 0;
            playSong(songs[currentSongIndex]);
        } catch (error) {
            console.error("Error:", error);
            updateUnavailableMessage("Something went wrong");
        }
    }
    
    function decodeHtmlEntities(text) {
        const textArea = document.createElement('textarea');
        textArea.innerHTML = text;
        return textArea.value;
    }
    
    function playSong(song) {
        const downloads = song.downloadUrl || [];
        let audioUrl = null;
        
        const qualityPriority = ["320kbps", "160kbps", "96kbps"];
        
        for (const quality of qualityPriority) {
            const cdn = downloads.find(dl => 
                dl.quality === quality && dl.url.includes("aac.saavncdn.com")
            );
            if (cdn) {
                audioUrl = cdn.url;
                break;
            }
        }
        
        if (audioUrl) {
            audioPlayer.src = audioUrl;
            const thumb = song.image?.find(img => img.quality === "500x500")?.url || "";
            
            songTitle.textContent = decodeHtmlEntities(song.name);
            songArtist.textContent = decodeHtmlEntities(song.artists?.primary?.[0]?.name || "Unknown");
            albumArt.src = thumb || 'asth.gif';
            
            audioPlayer.play()
                .then(() => {
                    isPlaying = true;
                    updatePlayPauseIcon();
                    updateUnavailableMessage(`Now playing: ${decodeHtmlEntities(song.name)}`);
                })
                .catch(error => {
                    console.error("Playback error:", error);
                    updateUnavailableMessage("Playback error. Check console.");
                });
        } else {
            updateUnavailableMessage("No playable CDN link found");
        }
    }
    
    function updatePlayPauseIcon() {
        if (isPlaying) {
            playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
            playPauseBtn.querySelector('i').classList.add('pulse-animation');
        } else {
            playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
            playPauseBtn.querySelector('i').classList.remove('pulse-animation');
        }
    }
    
    function togglePlayPause() {
        if (audioPlayer.src) {
            if (isPlaying) {
                audioPlayer.pause();
            } else {
                audioPlayer.play();
            }
            isPlaying = !isPlaying;
            updatePlayPauseIcon();
        }
    }
    
    playPauseBtn.addEventListener('click', togglePlayPause);
    
    document.addEventListener('keydown', function(e) {
        if (e.code === 'Space' && !isTypingInSearch) {
            e.preventDefault();
            togglePlayPause();
        }
    });
    
    prevBtn.addEventListener('click', function() {
        if (songs.length > 0) {
            currentSongIndex = (currentSongIndex - 1 + songs.length) % songs.length;
            playSong(songs[currentSongIndex]);
        }
    });
    
    nextBtn.addEventListener('click', function() {
        if (songs.length > 0) {
            currentSongIndex = (currentSongIndex + 1) % songs.length;
            playSong(songs[currentSongIndex]);
        }
    });
    
    audioPlayer.addEventListener('timeupdate', function() {
        const currentTime = audioPlayer.currentTime;
        const duration = audioPlayer.duration || 1;
        progress.style.width = `${(currentTime / duration) * 100}%`;
    });
    
    progressBar.addEventListener('click', function(e) {
        if (audioPlayer.src) {
            audioPlayer.currentTime = (e.offsetX / this.clientWidth) * audioPlayer.duration;
        }
    });
    
    volumeSlider.addEventListener('input', function() {
        audioPlayer.volume = this.value / 100;
    });
    
    function updateUnavailableMessage(message) {
        unavailableMessage.innerHTML = `<code>${message}</code>`;
    }
    
    audioPlayer.addEventListener('ended', function() {
        if (loopState === 1) {
            if (!hasLoopedOnce) {
                audioPlayer.currentTime = 0;
                audioPlayer.play();
                hasLoopedOnce = true;
            } else {
                if (songs.length > 0) {
                    currentSongIndex = (currentSongIndex + 1) % songs.length;
                    playSong(songs[currentSongIndex]);
                }
                hasLoopedOnce = false;
            }
        } else if (loopState === 2) {
            audioPlayer.currentTime = 0;
            audioPlayer.play();
        } else {
            if (songs.length > 0) {
                currentSongIndex = (currentSongIndex + 1) % songs.length;
                playSong(songs[currentSongIndex]);
            } else {
                isPlaying = false;
                updatePlayPauseIcon();
            }
        }
    });
    
    audioPlayer.addEventListener('play', function() {
        isPlaying = true;
        updatePlayPauseIcon();
    });
    
    audioPlayer.addEventListener('pause', function() {
        isPlaying = false;
        updatePlayPauseIcon();
    });
});
