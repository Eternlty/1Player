<template>
  <!-- 保持原有模板不变 -->
    <div class="player-container" :class="{ landscape: isLandscape }">
    <div class="background" :style="{ backgroundImage: 'url(' + (currentSong.cover || 'background.jpg') + ')' }"></div>
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
        if (this.currentTime * 1000 + 280 < this.lyrics[i].time) {  // 提前280毫秒切换
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

<style scoped lang="less">
@import '../styles/base.less';
@import '../styles/components/background.less';
@import '../styles/components/controls.less';
@import '../styles/components/song-list.less';
@import '../styles/components/cover.less';
@import '../styles/responsive.less';

/* 以下是保留的原有样式,移除后可能会导致小封面不显示 */
.lyric-box {
  flex: 1;
  padding: 10px;
  overflow-y: auto;
  text-align: center;
  font-size: 1.17em;
  line-height: 1.5;
  width: 90%;
  max-width: 400px;
  margin: 0 auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.lyric-box::-webkit-scrollbar {
  display: none;
}

.lyric-box .active {
  color: #1db954;
  font-weight: bold;
  font-size: 1.2em;
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
</style>