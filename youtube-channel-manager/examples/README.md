# Example content folder

This folder shows the file conventions the app understands. It contains no
actual video files (this is just documentation) - copy the `.json` files
next to your own `.mp4`/`.mov`/etc. files with matching names.

- `channel.json` — folder-wide defaults applied to every video that doesn't
  override them (privacy, made-for-kids answer, tags, description template).
- `my-trip-to-paris.json` — per-video metadata for a file named
  `my-trip-to-paris.mp4` (or `.mov`, `.mkv`, ...). Any field you omit falls
  back to the folder defaults, then to sensible built-in defaults.

Simpler alternatives to a full `.json` file, for a video named `clip.mp4`:

- `clip.title.txt` — plain text file containing just the title.
- `clip.description.txt` (or `clip.desc.txt`) — plain text description.
- `clip.tags.txt` — comma or newline separated tags.
- `clip.thumb.jpg` / `.png` — custom thumbnail, auto-attached.

If none of these exist, the app uses the filename itself (with dashes/underscores
turned into spaces) as the title, and the channel's folder-wide defaults for
everything else.
