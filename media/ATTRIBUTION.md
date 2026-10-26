# Hero media attribution

The landing-page hero video (`uenr-campus-loop.mp4`) and poster (`uenr-campus-poster.jpg`)
are derivative works made from the following photographs of the University of Energy and
Natural Resources (UENR) campus.

All photographs are by **Noahalorwu**, licensed under
[Creative Commons Attribution-ShareAlike 4.0 International (CC BY-SA 4.0)](https://creativecommons.org/licenses/by-sa/4.0/).

| Used in the video | Source |
| --- | --- |
| Entrance | [File:University of Energy and Natural Resources Entrance.jpg](https://commons.wikimedia.org/wiki/File:University_of_Energy_and_Natural_Resources_Entrance.jpg) |
| Auditorium | [File:UENR Auditorium.jpg](https://commons.wikimedia.org/wiki/File:UENR_Auditorium.jpg) |
| Campus scene 1 | [File:UENR 1.jpg](https://commons.wikimedia.org/wiki/File:UENR_1.jpg) |
| Campus scene 4 | [File:UENR 4.jpg](https://commons.wikimedia.org/wiki/File:UENR_4.jpg) |

**Changes made:** the photographs were cropped to 16:9, lightly denoised, given a slow
zoom (Ken Burns) motion and cross-faded into a 16-second looping MP4. A single frame was
exported as the poster image.

The derivative video and poster are likewise shared under CC BY-SA 4.0. This share-alike
obligation applies to the media files, not to the StudyCircle application code.

## Dashboard slideshow photos

The signed-in dashboard slideshow uses four visually reviewed photographs by **Noahalorwu**, each licensed under [Creative Commons Attribution-ShareAlike 4.0 International (CC BY-SA 4.0)](https://creativecommons.org/licenses/by-sa/4.0/).

| Dashboard photo | Source |
| --- | --- |
| UENR entrance sign | [File:UENR 2.jpg](https://commons.wikimedia.org/wiki/File:UENR_2.jpg) |
| Campus grounds | [File:UENR 1.jpg](https://commons.wikimedia.org/wiki/File:UENR_1.jpg) |
| GETFund hostel court | [File:UENR 5.jpg](https://commons.wikimedia.org/wiki/File:UENR_5.jpg) |
| Auditorium interior | [File:UENR Auditorium.jpg](https://commons.wikimedia.org/wiki/File:UENR_Auditorium.jpg) |

The local 1280 × 720 JPGs in `public/media/dashboard/` are Wikimedia-generated thumbnail versions of those photographs; no pixel edits were made. The dashboard applies a responsive CSS crop and links each displayed image's credit to its Commons file page and the CC BY-SA 4.0 license. These images do not imply UENR endorsement.

## Replacing the media

You can drop in your own UENR footage without touching the code. Keep the same filenames:

- `public/media/uenr-campus-loop.mp4` — H.264 MP4, 16:9, no audio track, ideally under 10 MB.
- `public/media/uenr-campus-poster.jpg` — a representative 16:9 still frame.

If you change the filenames, update `HERO_VIDEO` and `HERO_POSTER` in
`src/pages/public/Landing.tsx`.

If you replace the media with your own work, update or remove this attribution file and
the credit lines in `src/pages/public/Landing.tsx` and `README.md`.
