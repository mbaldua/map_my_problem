# Future Scope — WhatsApp Business Integration

## The idea
Use WhatsApp Business API as an input channel for reporting civic issues.
Instead of opening a browser, users send a photo to a WhatsApp number — report done.

## Why it makes sense
- ~500M WhatsApp users in India — already installed, zero learning curve
- Solves the "I won't download another app" problem
- Phone number = identity (no separate OTP needed)
- WA native location share → exact lat/lng, no browser geolocation API needed

## How the flow works

```
User sends photo to WA number
  ↓
WhatsApp Cloud API webhook → Next.js Route Handler
  Receives: image URL, phone number (verified), optional location, caption
  ↓
Run Gemini (same /api/verify-image as web flow)
  → Auto-classify category
  → Generate description
  → Duplicate check
  ↓
Bot replies with confirmation:
  "Got it 📍 Looks like water logging near Baner Road.
   Is that right? Reply:
   1️⃣ Yes, submit it
   2️⃣ Change to Garbage
   3️⃣ Change to Traffic"
  ↓
User replies "1"
  ↓
Issue inserted to Supabase → pin appears on map
  ↓
Bot confirms: "✅ Reported! View it here: mapmy.problems/i/abc123"
```

## Architecture impact

**Auth:** WA phone number IS the user identity. Auto-create users row on first message.
No OTP flow needed — WA has already verified the number.

**Gemini integration:** The /api/verify-image and /api/describe-image Route Handlers
work identically regardless of whether the image came from browser upload or WA webhook.
This is the right abstraction — build it web-first, WA just becomes another input channel.

**Map/discussion:** WA is input only. Users still need the web UI to browse the map,
upvote, and comment. WA and web are complementary, not competing.

## Cost
- WhatsApp Cloud API: free for first 1,000 conversations/month
- After that: ~₹0.50–1 per conversation (India)
- Effectively free at MVP scale

## What's needed to build it
1. Meta Business account + verified WhatsApp Business number (1–2 week approval)
2. Webhook endpoint: `/api/webhooks/whatsapp`
3. WA conversation state machine (photo → confirm → submit)
4. Rate limiting per phone number (spam prevention)
5. Moderation layer before reports go live (Gemini + optional human review)

## Discoverability problem to solve first
Users need to know the WA number exists.
Options: QR codes in public spaces, social media, auto-reply when someone messages the number.

## When to build
After the web report flow is fully live with 50–100 real reports on the map.
The WA channel multiplies reach — but only once there's something worth reaching.

## Open questions
- Should WA reports go live immediately or queue for review?
- How to handle duplicate reports from WA vs web for the same issue?
- Language support — Hindi, Marathi replies needed?
