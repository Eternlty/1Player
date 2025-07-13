// 本地音乐配置文件
export const localMusicList = [
  {
    id: 1,
    title: '使一颗心免于哀伤',
    artist: 'Chevy',
    cover: require('@/assets/img/1.jpg'),
    src: require('@/assets/music/1.mp3'),
    lrc: process.env.NODE_ENV === 'production' ? 'lrc/1.lrc' : 'lrc/1.lrc',
  },
  {
    id: 2,
    title: '希望有羽毛和翅膀',
    artist: 'Chevy',
    cover: require('@/assets/img/2.jpg'),
    src: require('@/assets/music/2.mp3'),
    lrc: process.env.NODE_ENV === 'production' ? 'lrc/2.lrc' : 'lrc/2.lrc',
  },
  {
    id: 3,
    title: '何者',
    artist: '谭晶',
    cover: require('@/assets/img/3.jpg'),
    src: require('@/assets/music/3.mp3'),
    lrc: process.env.NODE_ENV === 'production' ? 'lrc/3.lrc' : 'lrc/3.lrc',
  },
  {
    id: 4,
    title: '耀斑',
    artist: 'YMIR',
    cover: require('@/assets/img/4.jpg'),
    src: require('@/assets/music/4.mp3'),
    lrc: process.env.NODE_ENV === 'production' ? 'lrc/4.lrc' : 'lrc/4.lrc',
  },
  {
    id: 5,
    title: 'Da Capo',
    artist: 'HOYO-MiX',
    cover: require('@/assets/img/5.jpg'),
    src: require('@/assets/music/5.mp3'),
    lrc: process.env.NODE_ENV === 'production' ? 'lrc/5.lrc' : 'lrc/5.lrc',
  }
];