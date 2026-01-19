INSERT INTO music (music_id, file_path, title, bpm, artists, genre, duration)
VALUES (1, 'Cash Out.mp3', 'Cash Out', 160, 'Schrandy', 'Techno', 142)
ON CONFLICT (music_id) DO NOTHING;

INSERT INTO music (music_id, file_path, title, bpm, artists, genre, duration)
VALUES (2, 'harinezumi.mp3', 'harinezumi', 94, 'waera', 'House', 117)
ON CONFLICT (music_id) DO NOTHING;