// 本地音乐配置文件
export const localMusicList = [
  {
    id: 1,
    title: 'Landslide',
    artist: 'Oh Wonder',
    cover: process.env.NODE_ENV === 'production' ? '/lcx/music/img/1.jpg' : '/img/1.jpg',
    src: process.env.NODE_ENV === 'production' ? '/lcx/music/1.mp3' : '/music/1.mp3',
    lrc: process.env.NODE_ENV === 'production' ? '/lcx/lrc/1.lrc' : '/lrc/1.lrc',
  },
  {
    id: 2,
    title: 'Sacred Play Secret Place',
    artist: 'Matryoshka',
    cover: process.env.NODE_ENV === 'production' ? '/lcx/music/img/2.jpg' : '/img/2.jpg',
    src: process.env.NODE_ENV === 'production' ? '/lcx/music/2.mp3' : '/music/2.mp3',
    lrc: process.env.NODE_ENV === 'production' ? '/lcx/lrc/2.lrc' : '/lrc/2.lrc',
  },
  {
    id: 3,
    title: '爱情讯息',
    artist: '郭静',
    cover: process.env.NODE_ENV === 'production' ? '/lcx/music/img/3.png' : '/img/3.png',
    src: process.env.NODE_ENV === 'production' ? '/lcx/music/3.mp3' : '/music/3.mp3',
    lrc: process.env.NODE_ENV === 'production' ? '/lcx/lrc/3.lrc' : '/lrc/3.lrc',
  },
  {
    id: 4,
    title: '第57次取消发送',
    artist: '菲菲公主（陆绮菲）',
    cover: process.env.NODE_ENV === 'production' ? '/lcx/music/img/4.jpg' : '/img/4.jpg',
    src: process.env.NODE_ENV === 'production' ? '/lcx/music/4.mp3' : '/music/4.mp3',
    lrc: process.env.NODE_ENV === 'production' ? '/lcx/lrc/4.lrc' : '/lrc/4.lrc',
  }
];
