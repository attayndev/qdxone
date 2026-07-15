# QDXone 15-second film — "What a resume can't show you"

The commercial on the qdx.one front page (R2 key `shift-ready-hiring-v2.mp4`,
served at `/media/shift-ready-hiring-v2.mp4`). Yan's creative brief +
generation prompt (Seedance 2.0), kept for future cuts and channel versions.

**v2 (live):** closing QDXone end card added in post — crossfade starts at
12.6s (0.6s) into a brand card (three-bar mark, QDXone wordmark, Shift-Ready
Hiring™ tagline, cream #fbfaf7) while the final voiceover lands; runtime
stays 15.07s, audio untouched. Card generator: Pillow script (HelveticaNeue
Bold + stroke ≈ font-black); composite: ffmpeg overlay with alpha fade.
`shift-ready-hiring.mp4` (v1, no end card) remains in R2 as the clean master.

**Site presentation:** heading "What a resume can't show you." · sub "A
15-second film about the small moments that reveal who's shift-ready."

**Voiceover (final):** "A résumé can show where someone worked. Not who'll
show up, help the team, or step up. QDXone's five-minute check helps
restaurant owners see who to call first. Shift-Ready Hiring."

---

## Generation prompt (Seedance 2.0)

Create a **15-second cinematic commercial** set inside a real, busy
fast-casual restaurant. The film must feature only people and natural
restaurant activity.

No phones, computers, tablets, software screens, dashboards, floating
graphics, generated captions, or visible technology.

### Creative idea

A résumé can tell you where someone worked. A small human moment can reveal
far more.

### Visual direction

**0:00–0:04** — Before the restaurant opens, three job applicants sit beside
one another. They are all neat, prepared, and equally promising. The
restaurant owner looks across at them, trying to decide where to begin.
Intimate close-ups of faces, hands, and quiet nervous energy. Natural
morning light. Realistic performances.
*Voiceover:* "A résumé can show where someone worked."

**0:04–0:10** — A restaurant worker walking nearby accidentally drops a tray
of napkins and cups. One applicant immediately gets up, helps gather
everything, steadies the tray, and gives the worker a warm, reassuring
smile. Natural, not staged or heroic. The owner quietly notices.
*Voiceover:* "Not who'll show up, help the team, or step up."

**0:10–0:15** — The applicant returns to their seat. The owner smiles, opens
the staff-side gate, and invites the applicant into the restaurant. The new
hire joins the team as the restaurant comes alive. End on a warm, human shot
of the owner and new hire walking into the busy restaurant together.
*Voiceover:* "QDXone's five-minute check helps restaurant owners see who to
call first. Shift-Ready Hiring."

### Pronunciation

- **résumé:** "REZ-uh-may" · **QDXone:** "cue dee ex one" (possessive: "cue
  dee ex one's")
- Full phonetic read: "A REZ-uh-may can show where someone worked. Not
  who'll show up, help the team, or step up. Cue dee ex one's five-minute
  check helps restaurant owners see who to call first. Shift-Ready Hiring."

### Performance and style

Warm, grounded, observant, emotionally real. The owner reads as an actual
operator, not an executive. Applicants and staff are a natural mix of ages
and backgrounds. Restrained handheld camera, shallow depth of field,
authentic restaurant sound, subtle musical build. Final feeling:
recognition and relief — not triumph or spectacle. No character speaks on
camera; one warm, confident voiceover.

Do not portray the other applicants negatively — no one looks lazy,
careless, or foolish; the difference is one quiet act of awareness. No
exaggerated reactions, artificial smiles, glossy stock acting, slow motion,
VFX, warped hands, duplicated people, unreadable signs, or generated brand
text. Final frame stays visually clean for the QDXone logo in post.

---

**Ops note:** `/media/*` is edge-cached immutable for one year — a new cut
must be uploaded under a NEW R2 key (`wrangler r2 object put qdxone-media/…
--remote`) and the `src` updated in `CommercialVideo`.
