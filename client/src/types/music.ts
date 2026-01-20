export type Music = {
  musicId: number;
  title: string;
  bpm: number;
  artists: string;
  genre: string | null;
  duration: number;
  mp3Url: string;
  imageUrl: string;
};