# @LarkyMotion decoded (and how we mix it with our own ideas)

**How this was read.** I could not play the videos (YouTube blocks automated playback here), so this is built from what the public channel page and Shorts tab show: the title, view count and caption of every Short, plus the three automatic frames YouTube publishes for each Short (11 Shorts x 4 frames = 44 stills). Nothing about audio, exact cut timing or camera speed is measured. Anything marked *inferred* is a reading of the stills. Send the MP4s and `motion_probe.py` will replace the guesses with numbers.

## The channel in numbers

- 1.85K subscribers, 11 videos, **all Shorts** about AI, chips, big tech and crypto ("my take on recent events, my perspective on what might happen next").
- Views across the 11 Shorts: 1.6M, 760K, 612K, 329K, 228K, 210K, 143K, 107K, 24K, 12K, 1.1K. Total about 4.0M, median 210K. Almost all reach comes from the Shorts feed, not subscribers.

| Short (as titled) | Views | Why it likely did what it did |
|---|---|---|
| Will Satoshi's Bitcoin ever move? | 1.6M | one famous mystery + money; a yes/no question the viewer wants answered |
| Can Tim Cook really save Nvidia? | 760K | two big names that normally do not share a sentence |
| Why Jensen will be so valuable to Elon Musk? | 612K | name pair + a "secret" tease (shushing emoji) |
| Is this the end of Captcha? | 329K | something every viewer touched this week |
| What happens when Sam buys all the RAM? | 228K | a hypothetical with a villain-sounding actor and a cost the viewer pays (PC prices) |
| Is Space the Only Solution for AI's Power Hunger? | 210K | "only solution" absolutism |
| Why China is winning the AI race | 143K | geopolitics, no question mark, no names |
| Why you can't hack the world with a quantum computer yet | 107K | "can't yet" is a soft promise of danger |
| How did GTA influence self driving cars? | 24K | no stakes, no famous actor in the title |
| What happens when AI runs out of humans? | 12K | abstract, nobody to root for |
| Can NVIDIA's own AI chips expose Chinese smugglers? | 1.1K | too niche, jargon-heavy |

Patterns: **9 of 11 titles are questions**; the five biggest all carry a **named person or company** (Satoshi, Tim Cook, Jensen/Elon, Captcha, Sam/RAM); titles are one line, end in one emoji, and carry 2-3 hashtags. The three weakest have no named character or no concrete stake.

## The look (from the 44 stills)

- **Characters:** flat 2D "bean" people drawn with thin dark outlines: huge egg-shaped head, tiny dot-and-brow eyes, thin stick limbs and legs, simple one-colour clothes, ID lanyards and badges on office types, a grey-haired granny with round glasses, a bun-haired woman, a suit with a red tie, a yellow-skinned politician caricature. Skin tones vary. Faces carry all the acting: big round eyes for shock, half-lidded for smug, open mouth for panic.
- **World:** each character stands in a **detailed 3D-rendered set** (warehouse shelves and pallets, lab with a gold quantum chandelier, server room, bank vault, rocket on the pad, kitchen, newsroom, cinema marquee) with real textures, strong key light, rim light, volumetric haze and a shallow depth of field with bokeh. The contrast between a flat cartoon and a photoreal-ish room is the signature. *Inferred:* the sets are rendered in a game engine and the cartoon cutouts are composited in.
- **Props that carry the joke:** readable text and logos in the scene ("MEMORY UPGRADE" over a mountain of RAM sticks, "CHIPS NEEDED" sign, NVIDIA crates, a newspaper "INDICTMENT" headline, a "50/50 odds, year 6" calendar, a bitcoin on a desk in a pile of coins). One prop explains the point without a word.
- **Colour:** each Short has its own grade (blue-violet lab, warm orange warehouse, teal rocket pad, red alert room) with one strong light source.
- **Captions:** big heavy sans, white with a thick black outline, **2-4 words at a time, one word tinted** in an accent (purple, blue, orange, red, green, yellow), set in the lower-middle of the frame and never over the face. Each Short keeps one or two accent colours.
- **Shot mix (inferred from the four frames per Short):** alternating **extreme face close-ups** (face fills 80% of the frame), **medium shots of one character in a set**, and **wide shots where the character is small in a huge room**. Each Short's three auto-frames are three different set-ups, so there are at least three distinct shots per Short; the most-viewed ones look the busiest.

## The script engine (inferred from titles and caption fragments)

Caption fragments seen in frames: "WAIT SO WHAT", "ENGINEER SHRUGS WHO", "WAIT SO WHO'S", "YOU SEE MUSK", "EVERYONE CALLS IT", "HOW MANY TRIES", "LAUGHS GREAT", "GOES GREAT", "BUT ABOUT 2", "FIFTY WITHIN 10". That reads as:

1. **Hook = a question in the title and in the first second** ("What happens when X?").
2. **A tiny cast acts it out** in present-tense stage directions the narrator reads ("Engineer shrugs. Who?"). The confusion beat ("Wait, so what?") is the viewer's own question put in a character's mouth.
3. **One number or one named thing per sentence** ("88,000", "50/50 within 10 years", "about 2").
4. **A punchline or twist on the last line**, then the loop (the last line makes you want to rewatch or comment).
5. Length: short enough to loop (*inferred* 30-45 s).

## What to copy, what to change

Copy: question + named actor titles; flat bean characters in a rich lit 3D set; one prop that makes the point; word-timed 2-4 word captions with one accent word; face close-up / medium / wide rotation; a "wait, so...?" confusion beat; a last-line twist.
Change: their topics are saturated and time-sensitive news; ours can be evergreen (Indian folklore and myth read as tech). Do not copy their characters, set designs or exact wording.

## Mixed ideas (their format x our myth/horror)

1. **What if the Vetala was the first AI chatbot?** (built, see below) - a ghost that answers back with riddles; "subscription" gag; the unanswerable 25th question.
2. **Can Chitragupta's ledger ever be hacked?** - karma as an immutable ledger; the Satoshi pattern ("will it ever move?").
3. **What happens when Yamraj gets a GPU cluster?** - judgment day at 1M souls/second, queue jokes.
4. **Is Maya the first deepfake?** - the golden deer, Ravan's Sita illusion, "how many tries" gag.
5. **Why would a Brahmarakshas make the perfect cybersecurity guard?** - captcha joke ("select all the boats") on a river ghost.
6. **Can La Llorona beat a smart doorbell?** - the Nightmare Spin universe with a Ring camera.

## Built from idea 1

`videos/larky-vetala-ai/` (script, voice, timeline, render code); the finished MP4 was delivered in chat.
