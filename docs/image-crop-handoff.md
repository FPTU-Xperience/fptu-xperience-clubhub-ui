# Image crop before save

ImagePicker opens ImageCropModal for uploaded files whenever a recommended output size is supplied. This covers profile avatars, club logos, and club/activity covers. ProfileImagePicker uses the same crop modal for profile cover uploads.

The crop modal supports pointer dragging, arrow keys, zoom from 100% to 300%, and reset. Apply creates a new File containing only the retained region; parent pickers receive that file and existing save flows upload/store it. Cancel keeps the previous selection. Cropping happens entirely in the browser before upload. Avatar frames remain separate overlays.

Output dimensions: avatar/logo 300 × 300; profile/club cover 1200 × 300 (4:1); activity banner 1200 × 500 (12:5). The profile canvas and previews use the same ratio as crop output. JPEG/WebP/PNG are preserved when supported by canvas output, and output is checked against the existing 5 MB limit.

V2Modal tracks nested dialogs so Escape/focus apply only to the top dialog and page scrolling is restored only when all dialogs close. Titles use unique IDs.

Verification: crop geometry/drag limits unit tests, existing component render smoke checks, and browser fixture tests covering drag, zoom, real encoded output at all three sizes, and nested Escape behavior. The extension's file chooser automation requires file URL permission, so input selection was not automated; browser checks used a temporary local fixture. No live backend upload was performed.
