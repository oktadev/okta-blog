# Voice, Tone, and Tense

---

## Active Voice

- ❌ Use active voice throughout. Flag all passive voice.
  - Correct: "Pass the username as a parameter to SignIn()."
  - Incorrect: "The username is passed as a parameter to SignIn()."
- ⚠️ Scan for passive voice. If excessive (let's say 5+ occurrences), remind the user to run Grammarly.

---

## Tone

- ✅ Use a **relaxed, conversational tone** — like co-workers talking, not a lecture.
- ✅ **Prefer contractions**: aren't, can't, isn't, we're, won't, it's, etc.
- ❌ Do **not** write negatively about non-Okta solutions.

---

## Tense

- ❌ Use **present tense** when describing how something behaves. Flag future-tense constructions there.
  - Correct: "On success, the call returns a JSON object."
  - Incorrect: "On success, the call will return a JSON object."
- ✅ This rule targets **descriptions of behavior**, not narration of the tutorial. Telling readers what they're about to do is correct and expected — don't flag it.
  - Fine: "In this post, we'll build a dashboard", "you'll add the guard next", "we'll get there"
  - Flag: "the call will return a JSON object", "the component will re-render when the signal changes"
- 💡 Past tense is only acceptable when describing something that happened before the current task.

