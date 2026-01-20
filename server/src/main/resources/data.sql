INSERT INTO music (mp3_file_path, image_file_path, title, bpm, artists, genre, duration)
VALUES ('Cash Out.mp3', 'Cash Out.png', 'Cash Out', 160, 'Schrandy', 'Techno', 142)
ON CONFLICT (mp3_file_path) DO NOTHING;

INSERT INTO music (mp3_file_path, image_file_path, title, bpm, artists, genre, duration)
VALUES ('harinezumi.mp3', 'harinezumi.png', 'harinezumi', 94, 'waera', 'House', 117)
ON CONFLICT (mp3_file_path) DO NOTHING;

INSERT INTO music (mp3_file_path, image_file_path, title, bpm, artists, genre, duration)
VALUES ('Revenger.mp3', 'Revenger.png', 'Revenger', 150, 'Raiko', 'Dubstep', 182)
ON CONFLICT (mp3_file_path) DO NOTHING;

INSERT INTO music (mp3_file_path, image_file_path, title, bpm, artists, genre, duration)
VALUES ('Losing Control.mp3', 'Losing Control.png', 'Losing Control', 155, 'JPB, Mendum & Marvin Divine', 'Trap', 187)
ON CONFLICT (mp3_file_path) DO NOTHING;

INSERT INTO music (mp3_file_path, image_file_path, title, bpm, artists, genre, duration)
VALUES ('Hardwired.mp3', 'Hardwired.png', 'Hardwired', 87, 'Rameses B', 'Drum and Bass', 302)
ON CONFLICT (mp3_file_path) DO NOTHING;