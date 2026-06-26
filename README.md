# Dopamine_lock_web
Dopamine Lock  Web - A discipline web app that helps users eliminate distractions, complete focus missions, and build consistency.

## Runtime Uploads

Profile avatar uploads are stored at `backend/uploads/avatars` at runtime. Uploaded files are generated assets and are ignored by Git.

The tracked `.gitkeep` file exists only to preserve the upload folder structure in fresh clones. Local avatar storage can later be replaced with Cloudinary, AWS S3, or Google Cloud Storage without changing the repository policy that uploaded files must not be committed.
