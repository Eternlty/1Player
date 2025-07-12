<template>
  <!-- 保持原有模板不变 -->
    <div class="player-container" :class="{ landscape: isLandscape }">
    <div class="background" :style="{ backgroundImage: 'url(' + (currentSong.cover || '/img/background.jpg') + ')' }"></div>
    <div class="glass-overlay"></div>
    <div class="main-content">
      <div class="content-wrapper">
        <div class="song-list">
          <table>
            <thead>
              <tr>
                <th width="50px"></th>
                <th>歌曲名</th>
                <th>歌手</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(song, index) in localMusicList" 
                  :key="song.id" 
                  @click="selectSong(song)"
                  :class="{ selected: song.id === currentSong.id }">
                <td>{{ index + 1 }}</td>
                <td>{{ song.title }}</td>
                <td>{{ song.artist }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="player-area">
          <div class="cover-info">
            <img v-if="currentSong.cover" :src="currentSong.cover" class="cover" />
          </div>
          <div class="lyric-box">
            <template v-if="currentSong.id">
              <div v-for="(line, idx) in lyrics" :key="idx" 
                   :class="{ active: idx === currentLyricIndex }">
                {{ line.text }}
              </div>
            </template>
            <div v-else class="no-music">
              请选择音乐
            </div>
          </div>
          <div class="controls">
            <div class="button-group">
              <button @click="prevSong" title="上一首"><i class="fas fa-step-backward"></i></button>
              <button @click="togglePlay" :title="isPlaying ? '暂停' : '播放'">
                <i :class="isPlaying ? 'fas fa-pause' : 'fas fa-play'"></i>
              </button>
              <button @click="nextSong" title="下一首"><i class="fas fa-step-forward"></i></button>
              <button v-if="isMobile" @click="toggleLandscape" class="landscape-btn" title="横屏模式">
                <i :class="isLandscape ? 'fas fa-mobile-alt' : 'fas fa-sync-alt'"></i>
              </button>
            </div>
            
            <div class="slider-container">
              <span class="slider-icon"><i class="fas fa-clock"></i></span>
              <input type="range" min="0" :max="duration" v-model="currentTime" @input="seek" 
                class="progress-slider" title="播放进度" />
              <span class="time-display">
                {{ formatTime(currentTime) }} / {{ formatTime(duration) }}
              </span>
            </div>

            <div class="slider-container">
              <span class="slider-icon"><i class="fas fa-volume-up"></i></span>
              <input type="range" min="0" max="1" step="0.01" v-model="volume" @input="setVolume"
                class="volume-slider" title="音量调节" />
              <span class="volume-display">
                {{ Math.round(volume * 100) }}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
    <audio ref="audio" :src="currentSong.src" @timeupdate="onTimeUpdate" @ended="nextSong" @play="onPlay" @pause="onPause"></audio>
  </div>
</template>

<script>
import { localMusicList } from '../config/localMusic.js';
import { parseLRC } from '../utils/lrcParser.js';

export default {
  name: 'MusicPlayer',
  data() {
    return {
      localMusicList,
      currentSong: {}, // 初始为空对象
      lyrics: [],
      currentLyricIndex: 0,
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      volume: 0.8,
      isLandscape: false,
      isMobile: window.innerWidth <= 800,
      isLoading: true,
      audioCache: new Map(), // 音频缓存
    };
  },
  async mounted() {
    await this.preloadAudio();
    this.initAudio();
    this.isLoading = false;
    window.addEventListener('keydown', this.handleKeyDown);
    
  },
  beforeDestroy() {
    window.removeEventListener('keydown', this.handleKeyDown);
  },

  methods: {
    async preloadAudio() {
      const promises = [];
      for (const song of this.localMusicList) {
        const audio = new Audio(song.src);
        audio.preload = 'auto';
        this.audioCache.set(song.id, audio);
        promises.push(new Promise((resolve) => {
          audio.addEventListener('canplaythrough', resolve);
        }));
      }
      await Promise.all(promises);
    },
    initAudio() {
      const audio = this.$refs.audio;
      if (!audio) return;
      
      audio.volume = this.volume;
      audio.addEventListener('loadedmetadata', () => {
        this.duration = audio.duration;
      });
    },
    async loadLyric() {
      try {
        const res = await fetch(this.currentSong.lrc);
        const text = await res.text();
        this.lyrics = parseLRC(text);
        this.currentLyricIndex = 0;
      } catch (e) {
        console.error('歌词加载失败:', e);
        this.lyrics = [{text: '歌词加载失败'}];
      }
    },
    onTimeUpdate(e) {
      this.currentTime = e.target.currentTime;
      for (let i = 0; i < this.lyrics.length; i++) {
        if (this.currentTime * 1000 + 25 < this.lyrics[i].time) {  // 提前20毫秒切换
          this.currentLyricIndex = i - 1 >= 0 ? i - 1 : 0;
          // 自动滚动到当前歌词
          this.$nextTick(() => {
            const lyricBox = this.$el.querySelector('.lyric-box');
            const activeLine = lyricBox.querySelector('.active');
            if (activeLine) {
              activeLine.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
              });
            }
          });
          break;
        }
      }
    },
    togglePlay() {
      if (!this.currentSong.id) return;
      const audio = this.$refs.audio;
      if (audio.paused) {
        audio.play().catch(e => {
          console.error('播放失败:', e);
          this.isPlaying = false;
        });
        this.isPlaying = true;
      } else {
        audio.pause();
        this.isPlaying = false;
      }
    },
    seek() {
      const audio = this.$refs.audio;
      if (!audio) return;
      
      console.log('Seeking to:', this.currentTime, 'Duration:', this.duration);
      audio.currentTime = this.currentTime;
      
      if (!this.isPlaying) {
        audio.play().catch(e => {
          console.error('Seek后播放失败:', e);
        });
      }
    },
    setVolume() {
      if (this.$refs.audio) {
        this.$refs.audio.volume = this.volume;
      }
    },
    selectSong(song) {
      this.currentSong = song;
      this.isPlaying = false;
      this.currentTime = 0;
      this.loadLyric();
      this.$nextTick(() => {
        const audio = this.$refs.audio;
        if (!audio) return;
        
        audio.load();
        audio.play().then(() => {
          this.isPlaying = true;
        }).catch(e => {
          console.error('播放失败:', e);
          this.isPlaying = false;
        });
      });
    },
    prevSong() {
      if (!this.currentSong.id) return;
      let idx = this.localMusicList.findIndex(s => s.id === this.currentSong.id);
      idx = (idx - 1 + this.localMusicList.length) % this.localMusicList.length;
      this.selectSong(this.localMusicList[idx]);
    },
    nextSong() {
      if (!this.currentSong.id) return;
      let idx = this.localMusicList.findIndex(s => s.id === this.currentSong.id);
      idx = (idx + 1) % this.localMusicList.length;
      this.selectSong(this.localMusicList[idx]);
    },
    onPlay() {
      this.isPlaying = true;
    },
    onPause() {
      this.isPlaying = false;
    },
    formatTime(seconds) {
      if (isNaN(seconds)) return '00:00';
      const minutes = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    },
    toggleLandscape() {
      this.isLandscape = !this.isLandscape;
      if (this.isLandscape) {
        screen.orientation.lock('landscape').catch(err => {
          console.error('锁定横屏失败:', err);
        });
      } else {
        screen.orientation.unlock();
      }
    },
    
    handleKeyDown(e) {
      // 忽略快捷键在输入框中的触发
      if (e.target.tagName === 'INPUT') return;
      
      switch(e.key) {
        case ' ':
          // 空格键: 播放/暂停
          e.preventDefault();
          this.togglePlay();
          break;
        case 'ArrowLeft':
          // 左箭头: 后退5秒
          e.preventDefault();
          this.$refs.audio.currentTime = Math.max(0, this.currentTime - 5);
          break;
        case 'ArrowRight':
          // 右箭头: 前进5秒
          e.preventDefault();
          this.$refs.audio.currentTime = Math.min(this.duration, this.currentTime + 5);
          break;
        case 'ArrowUp':
          // 上箭头: 上一首
          e.preventDefault();
          this.prevSong();
          break;
        case 'ArrowDown':
          // 下箭头: 下一首
          e.preventDefault();
          this.nextSong();
          break;
      }
    },
    
    closeNotice() {
      if (this.dontShow) {
        localStorage.setItem('dontShowShortcutNotice', 'true');
      }
      this.showShortcutNotice = false;
    }
  }
};
</script>

<style scoped>
.player-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  color: #fff;
  font-family: 'Segoe UI', 'PingFang SC', 'Arial', sans-serif;
}

.background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
  filter: brightness(0.5) grayscale(0.3);
  z-index: -1;
  transition: background-image 0.5s ease;
}

.glass-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(10px);
  z-index: -1;
}

.main-content {
  height: 100%;
  padding: 0;
}

.content-wrapper {
  display: flex;
  height: 100%;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(5px);
  border-radius: 0;
  padding: 0;
}

.player-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
}

.cover-info {
  position: relative;
  text-align: center;
  margin-bottom: 20px;
}

.controls .landscape-btn {
  background: transparent;
  border: none;
  color: #fff;
  font-size: 1.3em;
  cursor: pointer;
  padding: 0 10px;
  order: 3;
}

.cover {
  width: 200px;
  height: 200px;
  border-radius: 12px;
  object-fit: cover;
  box-shadow: 0 4px 16px rgba(0,0,0,0.4);
}

.lyric-box {
  flex: 1;
  padding: 10px;
  overflow-y: auto;
  text-align: center;
  font-size: 1.17em; /* 减小10% */
  line-height: 1.6;
  width: 90%;
  max-width: 400px;
  margin: 0 auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.lyric-box::-webkit-scrollbar {
  display: none; /* Chrome, Safari, Opera */
}

.lyric-box .active {
  color: #1db954;
  font-weight: bold;
  font-size: 1.3em;
}

.no-music {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  font-size: 1.5em;
  color: rgba(255,255,255,0.7);
}

    .song-list {
      flex: 0 0 350px;  /* 增加宽度 */
      padding: 20px;
      overflow-y: auto;
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE and Edge */
}
.song-list::-webkit-scrollbar {
  display: none; /* Chrome, Safari, Opera */
}

.song-list table {
  width: 100%;
  border-collapse: collapse;
}

.song-list th, .song-list td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid rgba(255,255,255,0.1);
}

.song-list tr {
  cursor: pointer;
  transition: all 0.2s;
}

.song-list tr.selected {
  background: rgba(29, 185, 84, 0.2);
  color: #1db954;
  font-weight: bold;
}

.song-list tr:hover {
  background: rgba(255,255,255,0.2);
}

.song-list th {
  font-weight: bold;
  color: rgba(255,255,255,0.8);
}

.controls {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 15px;
  padding: 20px 0;
  margin-top: auto;
}

.slider-container {
  display: flex;
  align-items: center;
  gap: 8px;
}

.slider-icon {
  font-size: 1.2em;
  opacity: 0.8;
}

.time-display, .volume-display {
  font-size: 0.9em;
  min-width: 80px;
  text-align: center;
  opacity: 0.8;
}

.controls button {
  background: transparent;
  border: none;
  color: #fff;
  font-size: 1.5em;
  cursor: pointer;
  transition: color 0.2s;
  padding: 10px;
}

.controls button:hover {
  color: #1db954;
}

.progress-slider {
  width: 200px;
  appearance: none;
  -webkit-appearance: none;
  height: 6px;
  background: linear-gradient(90deg, #fff 0%, #fff var(--progress, 0%), rgba(255,255,255,0.3) var(--progress, 0%), rgba(255,255,255,0.3) 100%);
  border-radius: 3px;
  outline: none;
  cursor: pointer;
}

.volume-slider {
  width: 100px;
  appearance: none;
  -webkit-appearance: none;
  height: 6px;
  background: linear-gradient(90deg, #1db954 0%, #1db954 var(--volume, 0%), rgba(255,255,255,0.3) var(--volume, 0%), rgba(255,255,255,0.3) 100%);
  border-radius: 3px;
  outline: none;
  cursor: pointer;
}

.controls input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 16px;
  height: 16px;
  background: #fff;
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

.controls input[type="range"]:active {
  transform: scale(1.02);
}

.shortcut-notice {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.notice-content {
  background: #1e1e1e;
  padding: 20px;
  border-radius: 10px;
  max-width: 300px;
  text-align: center;
}

.notice-content h3 {
  color: #1db954;
  margin-bottom: 15px;
}

.notice-content p {
  margin: 10px 0;
  color: #fff;
}

.close-btn {
  background: #1db954;
  color: white;
  border: none;
  padding: 8px 20px;
  border-radius: 20px;
  margin-top: 15px;
  cursor: pointer;
}

@media (max-width: 800px) {
    .player-container.landscape {
      transform: rotate(90deg);
      transform-origin: left top;
      width: 100vh;
      height: 100vw;
      position: fixed;
      top: 0;
      left: 100vw;
    }

    .player-container.landscape .content-wrapper {
      flex-direction: row;
    }

    .player-container.landscape .song-list {
      flex: 0 0 45%;  /* 增加宽度 */
      height: 100vh;
    }

    .player-container.landscape .player-area {
      flex: 0 0 60%;
      height: 100vh;
    }

    .player-container.landscape {
      font-size: 0.85em;
    }
    .player-container.landscape .lyric-box {
      height: 240px; /* 固定高度 */
      width: 100%;
      font-size: 0.9em;
      margin-bottom: 20px;
      overflow-y: auto;
    }
    .player-container.landscape .player-area {
      padding-bottom: 80px; /* 为控制条留出空间 */
    }
    .player-container.landscape .controls {
      flex-direction: row;
      gap: 20px;
      padding: 15px 0;
    }
    .player-container.landscape .button-group {
      order: 2;
    }
    .player-container.landscape .slider-container {
      order: 1;
    }
    .player-container.landscape .progress-slider {
      width: 200px;
    }
    .player-container.landscape .volume-slider {
      width: 50px;
    }
    .player-container.landscape .song-list {
      font-size: 0.9em;
    }
    .player-container.landscape .controls button {
      font-size: 1.3em;
    }
    .player-container.landscape .time-display,
    .player-container.landscape .volume-display {
      font-size: 0.8em;
    }
    .player-container.landscape .cover {
      width: 150px;
      height: 150px;
    }
    .content-wrapper {
      flex-direction: column;
    }
    
    .song-list {
      flex: 0 0 250px;
      margin-bottom: 10px;
      overflow-y: auto;
      scrollbar-width: none;
      -ms-overflow-style: none;
    }
    .song-list::-webkit-scrollbar {
      display: none;
    }
    
    .player-area {
      padding: 10px;
      text-align: center;
    }
    
    .cover {
      width: 120px;
      height: 120px;
      margin: 0 auto;
    }
    
    .lyric-box {
      font-size: 1em;
      line-height: 1.8;
      max-height: 150px;
      overflow: hidden;
      margin: 10px auto;
      text-align: center;
      width: 90%;
    }
    
    .lyric-box .active {
      font-size: 1.1em;
    }
    
    .controls {
      display: flex;
      flex-direction: column;
      gap: 10px;
      padding: 10px;
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      background: transparent;
      z-index: 10;
    }

    .button-group {
      display: flex;
      justify-content: center;
      gap: 15px;
    }
    
    .controls input[type="range"] {
      width: 100%;
    }
  }
</style>
