const path = require('path');
const rootDir = path.resolve(__dirname, '..');
const storySourceDir = process.env.EDEN_STORY_SOURCE || path.resolve(rootDir, '..', '..', '02 雜誌', '正式版', 'THE STORY');
const storySiteDir = path.join(rootDir, 'images', 'works', 'the-story');
module.exports = { storySourceDir, storySiteDir };
