# Club and activity graphic cover editor

Both workspace cover dialogs use `CoverImageModal` with a sticky preview and Background, Shape, and Text tabs, following the profile cover editor. The Background tab switches between an uploaded image and graphic colors. The graphic starts from the existing public placeholder: community/experience wording, two translucent circles, and the original green, purple, or warm gradients. `GraphicBanner` owns the SVG rendering used by the editor, public club header, activity layout, and club workspace preview.

Managers can edit three text lines with independent fonts, text visibility, background and text colors (including palette gradients), font size, decoration, shape position/scale, and text position. Shape and text apply to graphic mode; uploaded photos keep the direct upload flow. Saving graphics renders a 1200 × 300 club PNG or a 1200 × 500 activity PNG and uses the existing club/activity cover upload and image-save APIs. No new backend fields are assumed. API errors retain the editor and generated file for retry.

Editing parameters are cached on the device under `clubhub:v2:graphic-banner:<accountId>:club:<clubId>` or `...:activity:<activityId>`. The cache is restored only when its saved image URL matches the entity's current cover URL; the uploaded image remains authoritative. Parameter editing on another device requires a future backend graphic-design contract. This work does not establish live upload or backend persistence support.

Validation covers deterministic templates, palette/settings validation, cache key and URL isolation, and server rendering of all three tabs, text/font/position controls, and escaped SVG text. Browser layout and real PNG/upload flows require visual and live integration checks.
