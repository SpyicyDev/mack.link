-- Profile v2 migration: add support for image links and subtitles
PRAGMA foreign_keys=ON;

ALTER TABLE profile_links ADD COLUMN type TEXT DEFAULT 'button'; -- 'button' | 'image'
ALTER TABLE profile_links ADD COLUMN image_url TEXT DEFAULT '';
ALTER TABLE profile_links ADD COLUMN image_alt TEXT DEFAULT '';
ALTER TABLE profile_links ADD COLUMN subtitle TEXT DEFAULT '';

