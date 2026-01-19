INSERT INTO music (file_path, title, bpm, artists, genre, duration)
VALUES ('Cash Out.mp3', 'Cash Out', 160, 'Schrandy', 'Techno', 142)
ON CONFLICT (file_path) DO NOTHING;

INSERT INTO music (file_path, title, bpm, artists, genre, duration)
VALUES ('harinezumi.mp3', 'harinezumi', 94, 'waera', 'House', 117)
ON CONFLICT (file_path) DO NOTHING;